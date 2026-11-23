import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

// Keep public names short and plain: no emojis, no odd symbols
function cleanName(raw: unknown): string {
  const name = String(raw ?? '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 16)
  return name || 'Anonymous Trekker'
}

export async function POST(req: NextRequest) {
  try {
    const { amount, email, showName, publicName } = await req.json()

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Enjoying Trekkon Fantasy Leagues? Leave a tip!',
              description: 'What began as a hobby project turned into hundreds of hours of late-night coding and paying for various website hosting tools. Consider a one-time gift to help cover your league, support the platform, and keep the trek going!',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      // Read by the webhook once Stripe confirms payment
      metadata: {
        kind: 'tip',
        show_publicly: showName ? 'true' : 'false',
        public_name: cleanName(publicName),
      },
      success_url: `${req.headers.get('origin')}/tip-jar?tipped=true`,
      cancel_url: `${req.headers.get('origin')}/tip-jar`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Tip checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}