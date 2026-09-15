import { Resend } from 'resend'
import { NotificationEmail } from '@/components/emails/NotificationEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

type Recipient = {
  email: string
  playerName: string
}

export async function POST(req: Request) {
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

  const results = await Promise.allSettled(
    recipients.map((r) =>
      resend.emails.send({
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
    )
  )

  const failures = results.filter((r) => r.status === 'rejected')
  if (failures.length > 0) {
    console.error('Some emails failed to send:', failures)
  }

  return Response.json({
    success: true,
    sent: results.length - failures.length,
    failed: failures.length,
  })
}