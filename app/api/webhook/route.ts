import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

 if (event.type === 'checkout.session.completed') {
  const session = event.data.object as Stripe.Checkout.Session
  const userId = session.client_reference_id
  const tier = session.metadata?.tier
  const customerId = session.customer as string

  if (userId && tier) {
    await supabaseAdmin
      .from('profiles')
      .update({ tier, stripe_customer_id: customerId })
      .eq('user_id', userId)
  }
}

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string

    const customer = await stripe.customers.retrieve(customerId)
    if (!customer.deleted && customer.email) {
      await supabaseAdmin
        .from('profiles')
        .update({ tier: 'stowaway' })
        .eq('email', customer.email)
    }
  }

  return NextResponse.json({ received: true })
}