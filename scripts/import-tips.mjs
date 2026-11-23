// One-time import of past Stripe tips into the supporters table.
// Run: node --env-file=.env.local scripts/import-tips.mjs
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

let imported = 0
let skipped = 0

for await (const s of stripe.checkout.sessions.list({ limit: 100, status: 'complete' })) {
  // Tips are one-time payments; memberships are subscriptions and carry a tier
  const isTip = s.mode === 'payment' && s.payment_status === 'paid' && !s.metadata?.tier
  if (!isTip) { skipped++; continue }

  // Match the tipper to their Trekkon account by email to use their display name
  const email = s.customer_details?.email ?? s.customer_email ?? null
  let publicName = 'Anonymous Trekker'
  if (email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('email', email)
      .maybeSingle()
    if (profile?.display_name) publicName = profile.display_name.slice(0, 18)
  }

  const { error } = await supabase.from('supporters').upsert(
    {
      stripe_session_id: s.id,
      public_name: publicName,
      amount_cents: s.amount_total ?? 0,
      show_publicly: true,
      created_at: new Date(s.created * 1000).toISOString(),
    },
    { onConflict: 'stripe_session_id', ignoreDuplicates: true }
  )
  if (error) console.error('Failed:', s.id, error.message)
  else imported++
}

console.log(`Done. Imported ${imported} tip(s), skipped ${skipped} other session(s).`)