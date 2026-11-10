import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin, requireGlobalAdmin, listAllAuthUsers } from '@/lib/adminServer'

const DAY = 24 * 60 * 60 * 1000

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

// Ask Stripe who is actually paying. Returns null if Stripe isn't reachable so the page still loads.
async function getStripeStats() {
  if (!stripe) return null
  try {
    const payingEmails = new Set<string>()
    let active = 0
    let pastDue = 0
    let monthlyCents = 0
    for (const status of ['active', 'past_due'] as const) {
      for await (const sub of stripe.subscriptions.list({ status, limit: 100, expand: ['data.customer'] })) {
        if (status === 'active') active++
        else pastDue++
        const customer = sub.customer as Stripe.Customer | Stripe.DeletedCustomer
        const email = 'email' in customer && customer.email ? customer.email.toLowerCase() : null
        if (email) payingEmails.add(email)
        if (status === 'active') {
          for (const item of sub.items.data) {
            const price = item.price
            const amount = (price.unit_amount ?? 0) * (item.quantity ?? 1)
            const interval = price.recurring?.interval
            const count = price.recurring?.interval_count ?? 1
            if (interval === 'month') monthlyCents += amount / count
            else if (interval === 'year') monthlyCents += amount / (12 * count)
            else if (interval === 'week') monthlyCents += (amount * 52) / (12 * count)
          }
        }
      }
    }
    return { active, pastDue, monthlyCents: Math.round(monthlyCents), payingEmails }
  } catch (e) {
    console.error('Stripe stats failed:', e)
    return null
  }
}

// Count rows safely: if a table/column doesn't exist, return null instead of crashing the page
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeCount(table: string, apply?: (q: any) => any): Promise<number | null> {
  try {
    let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
    if (apply) q = apply(q)
    const { count, error } = await q
    return error ? null : count ?? 0
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const adminId = await requireGlobalAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })

  const now = Date.now()
  const since = (days: number) => new Date(now - days * DAY).toISOString()

  // Players
  const { data: profiles } = await supabaseAdmin.from('profiles').select('tier, email_opt_in, email')
  const tierCounts: Record<string, number> = { stowaway: 0, castaway: 0, crewchief: 0, teamprincipal: 0 }
  let emailOptIn = 0
  for (const p of profiles ?? []) {
    const t = p.tier ?? 'stowaway'
    tierCounts[t] = (tierCounts[t] ?? 0) + 1
    if (p.email_opt_in) emailOptIn++
  }
  const paidTier = tierCounts.castaway + tierCounts.crewchief + tierCounts.teamprincipal

  // Compare paid tiers against real Stripe subscriptions (matched by email)
  const stripeStats = await getStripeStats()
  let stripePaying: number | null = null
  let comped: number | null = null
  if (stripeStats) {
    const paidProfiles = (profiles ?? []).filter((p) => p.tier && p.tier !== 'stowaway')
    stripePaying = paidProfiles.filter((p) => p.email && stripeStats.payingEmails.has(p.email.toLowerCase())).length
    comped = paidProfiles.length - stripePaying
  }

  const authUsers = await listAllAuthUsers()
  const newSince = (days: number) => authUsers.filter((u) => u.created_at >= since(days)).length
  const activeSince = (days: number) => authUsers.filter((u) => u.last_sign_in_at && u.last_sign_in_at >= since(days)).length

  // Leagues (real ones only: not archived, not chat rooms, not the social game)
  const { data: leagues } = await supabaseAdmin
    .from('leagues')
    .select('league_type, is_private, is_archived, draft_status, is_show_chat')
  const real = (leagues ?? []).filter((l) => !l.is_archived && !l.is_show_chat && l.league_type !== 'social_game')
  const byType: Record<string, number> = {}
  for (const l of real) byType[l.league_type] = (byType[l.league_type] ?? 0) + 1

  return NextResponse.json({
    generatedAt: new Date(now).toISOString(),
    players: {
      total: (profiles ?? []).length,
      paidTier,
      tiers: tierCounts,
      emailOptIn,
      new7: newSince(7),
      new30: newSince(30),
      active7: activeSince(7),
      active30: activeSince(30),
    },
    leagues: {
      active: real.length,
      public: real.filter((l) => !l.is_private).length,
      private: real.filter((l) => l.is_private).length,
      draftsLive: real.filter((l) => l.draft_status === 'in_progress').length,
      archived: (leagues ?? []).filter((l) => l.is_archived).length,
      byType,
      memberships: await safeCount('league_members'),
    },
    payments: stripeStats
      ? {
          activeSubscriptions: stripeStats.active,
          pastDue: stripeStats.pastDue,
          monthlyRevenue: stripeStats.monthlyCents / 100,
          payingPlayers: stripePaying,
          comped,
        }
      : null,
    activity: {
      chat24h: await safeCount('messages', (q) => q.gte('created_at', since(1))),
      chat7d: await safeCount('messages', (q) => q.gte('created_at', since(7))),
      predictions7d: await safeCount('predictions', (q) => q.gte('created_at', since(7))),
      notifications7d: await safeCount('notifications', (q) => q.gte('created_at', since(7))),
    },
  })
}