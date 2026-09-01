import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { amount, email } = await req.json()

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
              description: 'What began as a hobby project turned into hundreds of hours of late-night coding and paying for various website hosting tools. Consider a one-time tip to help cover your league, support the platform, and keep the trek going!',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${req.headers.get('origin')}/extras?tipped=true`,
      cancel_url: `${req.headers.get('origin')}/extras`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Tip checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}