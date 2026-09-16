import { Resend } from 'resend'
import { NotificationEmail } from '@/components/emails/NotificationEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

type Recipient = {
  email: string
  playerName: string
}

export async function POST(req: Request) {
  const passcode = req.headers.get('x-trekkon-passcode')
  if (passcode !== process.env.NOTIFICATION_EMAIL_PASSCODE) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
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

  if (recipients.length > 100) {
    return Response.json({ error: 'Too many recipients for a single request.' }, { status: 400 })
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
  })
}