import { Resend } from 'resend'
import { NotificationEmail } from '@/components/emails/NotificationEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const { data, error } = await resend.emails.send({
    from: 'Trekkon Fantasy Leagues <notifications@trekkonleagues.com>',
    to: ['codyray.fischer@gmail.com'], // swap in an email you can actually check
    subject: 'Test Email from Trekkon!',
    react: NotificationEmail({
      playerName: 'Cody',
      message: 'This is a test to confirm Resend is working correctly with your new branded template.',
      linkUrl: 'https://trekkonleagues.com',
      linkText: 'Visit Trekkon Fantasy Leagues →',
    }),
  })

  if (error) {
    return Response.json({ error }, { status: 500 })
  }

  return Response.json({ success: true, data })
}