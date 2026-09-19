import { Resend } from 'resend'
import { NotificationEmail } from '@/components/emails/NotificationEmail'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Recipient = {
  email: string
  playerName: string
}

const MAX_RECIPIENTS_PER_REQUEST = 30

export async function POST(req: Request) {
  // 1. Require a real, valid Supabase session — no anonymous requests allowed
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return Response.json({ error: 'Missing authorization.' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return Response.json({ error: 'Invalid or expired session.' }, { status: 401 })
  }

  const { recipients, subject, message, linkUrl, linkText } = await req.json() as {
    recipients: Recipient[]
    subject: string
    message: string
    linkUrl?: string
    linkText?: string
  }

  if (!recipients || recipients.length === 0) {
    return Response.json({ error: 'No recipients provided.' }, { status: 400 })
  }

  // 2. Cap how many people a single logged-in Player can email in one call
  if (recipients.length > MAX_RECIPIENTS_PER_REQUEST) {
    return Response.json({ error: 'Too many recipients for a single request.' }, { status: 400 })
  }

  // 3. Verify every recipient email actually belongs to a real, opted-in profile —
  //    this stops someone from passing arbitrary outside email addresses
  const recipientEmails = recipients.map((r) => r.email)
  const { data: validProfiles } = await supabaseAdmin
    .from('profiles')
    .select('email, display_name, email_opt_in')
    .in('email', recipientEmails)
    .eq('email_opt_in', true)

  const validEmailSet = new Set((validProfiles ?? []).map((p) => p.email))
  const safeRecipients = recipients.filter((r) => validEmailSet.has(r.email))

  if (safeRecipients.length === 0) {
    return Response.json({ error: 'No valid, opted-in recipients found.' }, { status: 400 })
  }

  const results = []
  for (const r of safeRecipients) {
    try {
      const res = await resend.emails.send({
        from: 'Trekkon Fantasy Leagues <notifications@trekkonleagues.com>',
        replyTo: 'hello@trekkonleagues.com',
        to: [r.email],
        subject,
        react: NotificationEmail({
          playerName: r.playerName,
          message,
          linkUrl,
          linkText,
        }),
      })
      results.push(res)
    } catch (err) {
      results.push({ error: err })
    }
    await new Promise((resolve) => setTimeout(resolve, 550))
  }

  const failures = results.filter((r: any) => r.error)
  if (failures.length > 0) {
    console.error('Some emails failed to send:', failures)
  }

  return Response.json({
    success: true,
    sent: results.length - failures.length,
    failed: failures.length,
    skipped: recipients.length - safeRecipients.length,
  })
}