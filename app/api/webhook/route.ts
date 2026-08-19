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
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', customer.email)
      .single()

    await supabaseAdmin
      .from('profiles')
      .update({ tier: 'stowaway' })
      .eq('email', customer.email)

    if (profileData?.user_id) {
      const { data: hostedLeagues } = await supabaseAdmin
        .from('leagues')
        .select('id, name, league_type, slug')
        .eq('host_user_id', profileData.user_id)
        .eq('is_private', true)

      if (hostedLeagues && hostedLeagues.length > 0) {
        const leagueIds = hostedLeagues.map((l: { id: number }) => l.id)

        await supabaseAdmin
          .from('leagues')
          .update({ is_frozen: true })
          .in('id', leagueIds)

        for (const league of hostedLeagues) {
          const { data: members } = await supabaseAdmin
            .from('league_members')
            .select('user_id')
            .eq('league_id', league.id)

          if (members && members.length > 0) {
            await supabaseAdmin.from('notifications').insert(
              members.map((m: { user_id: string }) => ({
                user_id: m.user_id,
                message: `${league.name} has been frozen because the host's membership dropped below Crew Chief. Activity will resume if they re-upgrade.`,
                link: `/leagues/${league.league_type}/${league.slug}`,
              }))
            )
          }
        }
      }
    }
  }
}

  return NextResponse.json({ received: true })
}