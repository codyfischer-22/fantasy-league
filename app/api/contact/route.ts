import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { name, email, reason, message } = await req.json()

    if (!name || !email || !reason || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const { error: saveError } = await supabaseAdmin.from('contact_submissions').insert({
      name,
      email,
      reason,
      message,
    })

    if (saveError) {
      console.error('Contact submission save failed:', saveError)
    }

    const { data: admins } = await supabaseAdmin
  .from('profiles')
  .select('user_id')
  .eq('is_global_admin', true)

if (admins && admins.length > 0) {
  const { error: notifError } = await supabaseAdmin.from('notifications').insert(
    admins.map((a) => ({
      user_id: a.user_id,
      message: `📬 New contact form submission!`,
      link: '/admin/support-center?tab=contact',
    }))
  )
  if (notifError) {
    console.error('Contact form admin notification failed:', notifError)
  }
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