// Sync each member's current Stripe subscription status.
// Matches by stripe_customer_id, or by email if the ID was never saved.
// Run: node --env-file=.env.local scripts/sync-subscriptions.mjs
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const key = process.env.STRIPE_SECRET_KEY ?? ''
if (!key.startsWith('sk_live_')) {
  console.error('Stop: STRIPE_SECRET_KEY is not a live key (sk_live_...). Swap it in .env.local first.')
  process.exit(1)
}

const stripe = new Stripe(key)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Newest subscription per customer
const latest = new Map()
for await (const sub of stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] })) {
  const custId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const prev = latest.get(custId)
  if (!prev || sub.created > prev.created) latest.set(custId, sub)
}

let byId = 0, byEmail = 0, unmatched = []
for (const [custId, sub] of latest) {
  const email = typeof sub.customer === 'object' && !sub.customer.deleted ? sub.customer.email : null

  // 1) Match by customer ID
  const { data: idRows } = await supabase
    .from('profiles')
    .update({ subscription_status: sub.status })
    .eq('stripe_customer_id', custId)
    .select('user_id')
  if (idRows && idRows.length > 0) { byId++; continue }

  // 2) Fall back to email, and save the missing customer ID
  if (email) {
    const { data: emailRows } = await supabase
      .from('profiles')
      .update({ subscription_status: sub.status, stripe_customer_id: custId })
      .ilike('email', email)
      .select('user_id')
    if (emailRows && emailRows.length > 0) { byEmail++; continue }
  }
  unmatched.push(`${custId} (${email ?? 'no email'}) — ${sub.status}`)
}

console.log(`Done. Matched ${byId} by customer ID, ${byEmail} by email.`)
if (unmatched.length) console.log('No Trekkon account found for:\n' + unmatched.join('\n'))