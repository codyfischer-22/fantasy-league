import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

const priceMap: Record<string, string> = {
  castaway: 'price_1U3sBW1iDc94BxsyaNCyLUgT',
  crewchief: 'price_1U3sBX1iDc94Bxsydih4bcjC',
  teamprincipal: 'price_1U3sBV1iDc94BxsyXPdP0UCH',
}

export async function POST(req: NextRequest) {
  try {
    const { tier, userId, email } = await req.json()

    const priceId = priceMap[tier]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      metadata: { userId, tier },
      success_url: `${req.headers.get('origin')}/account?upgraded=true`,
      cancel_url: `${req.headers.get('origin')}/account`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}