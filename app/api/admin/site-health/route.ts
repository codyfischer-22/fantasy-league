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
const { data: profiles } = await supabaseAdmin.from('profiles').select('user_id, tier, email_opt_in, email, last_seen_at')
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
  const activeSince = (days: number) => (profiles ?? []).filter((p) => p.last_seen_at && p.last_seen_at >= since(days)).length

  // Leagues (real ones only: not archived, not chat rooms, not the social game)
  const { data: leagues } = await supabaseAdmin
    .from('leagues')
    .select('league_type, is_private, is_archived, draft_status, is_show_chat')
  const real = (leagues ?? []).filter((l) => !l.is_archived && !l.is_show_chat && l.league_type !== 'social_game')
  const byType: Record<string, number> = {}
  for (const l of real) byType[l.league_type] = (byType[l.league_type] ?? 0) + 1

// Trust Issue5 (social deduction game)
const { data: socialGames } = await supabaseAdmin
  .from('social_games')
  .select('id, status, skin, host_user_id, created_at')

const games = socialGames ?? []
const liveGames = games.filter((g) => g.status === 'in_progress' || g.status === 'captain_guess').length
const openLobbies = games.filter((g) => g.status === 'lobby').length
const completed7 = games.filter((g) => (g.status === 'good_wins' || g.status === 'evil_wins') && g.created_at >= since(7)).length
const completed30 = games.filter((g) => (g.status === 'good_wins' || g.status === 'evil_wins') && g.created_at >= since(30)).length
const disbanded30 = games.filter((g) => g.status === 'disbanded' && g.created_at >= since(30)).length

const skinCounts: Record<string, number> = {}
for (const g of games) skinCounts[g.skin] = (skinCounts[g.skin] ?? 0) + 1
const topSkin = Object.entries(skinCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

const { data: allSeats } = await supabaseAdmin
  .from('social_game_players')
  .select('user_id, game_id')
const seats = allSeats ?? []
const uniquePlayers30 = new Set(
  seats
    .filter((s) => games.find((g) => g.id === s.game_id && g.created_at >= since(30)))
    .map((s) => s.user_id)
).size
const seatCountsByGame = new Map<number, number>()
for (const s of seats) seatCountsByGame.set(s.game_id, (seatCountsByGame.get(s.game_id) ?? 0) + 1)
const finishedGameIds = games.filter((g) => ['good_wins', 'evil_wins', 'disbanded'].includes(g.status)).map((g) => g.id)
const finishedSeatCounts = finishedGameIds.map((id) => seatCountsByGame.get(id) ?? 0).filter((n) => n > 0)
const avgPlayersPerGame = finishedSeatCounts.length > 0
  ? Math.round((finishedSeatCounts.reduce((a, b) => a + b, 0) / finishedSeatCounts.length) * 10) / 10
  : null

const goodWins = games.filter((g) => g.status === 'good_wins').length
const evilWins = games.filter((g) => g.status === 'evil_wins').length
const totalDecided = goodWins + evilWins
const goodWinRate = totalDecided > 0 ? Math.round((goodWins / totalDecided) * 100) : null

const castawayHosts = (profiles ?? []).filter((p) => p.tier === 'castaway').length
const castawayHostedGames = games.filter((g) => {
  const hostProfile = (profiles ?? []).find((p) => p.user_id === g.host_user_id)
  return hostProfile?.tier === 'castaway'
}).length

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
        socialGame: {
      liveGames,
      openLobbies,
      completed7,
      completed30,
      uniquePlayers30,
      avgPlayersPerGame,
      disbanded30,
reports30: await safeCount('social_game_reports', (q) => q.gte('created_at', since(30))),      goodWinRate,
      topSkin,
      castawayHostedGames,
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