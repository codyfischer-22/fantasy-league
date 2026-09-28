import { Resend } from 'resend'
import { NotificationEmail } from '@/components/emails/NotificationEmail'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function handle(req: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected || req.headers.get('authorization') !== `Bearer ${expected}`) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const nowIso = new Date().toISOString()

  // Claim due messages. A row can only leave 'scheduled' once, so two
  // overlapping runs can never send the same message twice.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from('admin_messages')
    .update({ status: 'sent', sent_at: nowIso })
    .eq('status', 'scheduled')
    .lte('scheduled_for', nowIso)
    .select('*')

  if (claimError) {
    console.error('Could not claim scheduled messages:', claimError)
    return Response.json({ error: 'Claim failed.' }, { status: 500 })
  }

  let processed = 0

  for (const msg of claimed ?? []) {
    try {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, email, display_name, email_opt_in')
        .in('user_id', msg.recipient_ids)

      const people = profiles ?? []
      let notifSent = 0
      let emailSent = 0
      let emailFailed = 0
      let emailSkipped = 0

      if (msg.via_notification && people.length > 0) {
        const { error } = await supabaseAdmin.from('notifications').insert(
          people.map((p) => ({
            user_id: p.user_id,
            message: msg.message,
            link: msg.link_url || null,
          }))
        )
        if (!error) notifSent = people.length
      }

      if (msg.via_email) {
        // Opt-in is checked now, so anyone who unsubscribed since scheduling is skipped.
        const optedIn = people.filter((p) => p.email_opt_in)
        emailSkipped = people.length - optedIn.length

        for (const p of optedIn) {
          try {
            const res = await resend.emails.send({
              from: 'Trekkon Fantasy Leagues <notifications@trekkonleagues.com>',
              replyTo: 'hello@trekkonleagues.com',
              to: [p.email],
              subject: msg.subject,
              react: NotificationEmail({
                playerName: p.display_name || 'Player',
                message: msg.message,
                linkUrl: msg.link_url || undefined,
                linkText: msg.link_text || undefined,
              }),
            })
            if (res.error) emailFailed++
            else emailSent++
          } catch {
            emailFailed++
          }
          await new Promise((resolve) => setTimeout(resolve, 550))
        }
      }

      await supabaseAdmin
        .from('admin_messages')
        .update({
          notif_sent: msg.via_notification ? notifSent : null,
          email_sent: msg.via_email ? emailSent : null,
          email_failed: msg.via_email ? emailFailed : null,
          email_skipped: msg.via_email ? emailSkipped : null,
        })
        .eq('id', msg.id)

      processed++
    } catch (err) {
      console.error('Scheduled message failed:', msg.id, err)
      await supabaseAdmin.from('admin_messages').update({ status: 'failed' }).eq('id', msg.id)
    }
  }

  return Response.json({ success: true, processed })
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}
