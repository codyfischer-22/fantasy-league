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

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return Response.json({ error: 'Missing authorization.' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return Response.json({ error: 'Invalid or expired session.' }, { status: 401 })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_global_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_global_admin) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 })
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

  const results = []
for (const r of recipients) {
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
  await new Promise((resolve) => setTimeout(resolve, 550)) // stay under ~2/sec
}

const failures = results.filter((r: any) => r.error)
if (failures.length > 0) {
  console.error('Some emails failed to send:', failures)
}

return Response.json({
  success: true,
  sent: results.length - failures.length,
  failed: failures.length,
})
}