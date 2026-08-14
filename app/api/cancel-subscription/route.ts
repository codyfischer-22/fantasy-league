import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 400 })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    })

   const periodEndTimestamp = subscription.items.data[0]?.current_period_end
const periodEnd = periodEndTimestamp
  ? new Date(periodEndTimestamp * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  : 'the end of your billing period'

    return NextResponse.json({ success: true, periodEnd })
  } catch (error: any) {
    console.error('Cancel Subscription Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}