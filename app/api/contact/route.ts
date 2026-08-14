import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { name, email, reason, message } = await req.json()

    if (!name || !email || !reason || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const { error } = await resend.emails.send({
      from: 'Trekkon Contact Form <hello@trekkonleagues.com>',
      to: 'hello@trekkonleagues.com',
      replyTo: email,
      subject: `[${reason}] New Contact Form Message from ${name}`,
      text: `From: ${name} (${email})\nReason: ${reason}\n\nMessage:\n${message}`,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Something went wrong sending your message.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}