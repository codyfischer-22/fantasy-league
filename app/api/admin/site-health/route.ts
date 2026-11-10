import { NextResponse } from 'next/server'
import { supabaseAdmin, requireGlobalAdmin, listAllAuthUsers } from '@/lib/adminServer'

const DAY = 24 * 60 * 60 * 1000

// Count rows safely: if a table/column doesn't exist, return null instead of crashing the page
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
  const { data: profiles } = await supabaseAdmin.from('profiles').select('tier, email_opt_in')
  const tierCounts: Record<string, number> = { stowaway: 0, castaway: 0, crewchief: 0, teamprincipal: 0 }
  let emailOptIn = 0
  for (const p of profiles ?? []) {
    const t = p.tier ?? 'stowaway'
    tierCounts[t] = (tierCounts[t] ?? 0) + 1
    if (p.email_opt_in) emailOptIn++
  }
  const paying = tierCounts.castaway + tierCounts.crewchief + tierCounts.teamprincipal

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
      paying,
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
    activity: {
      chat24h: await safeCount('messages', (q) => q.gte('created_at', since(1))),
      chat7d: await safeCount('messages', (q) => q.gte('created_at', since(7))),
      predictions7d: await safeCount('predictions', (q) => q.gte('created_at', since(7))),
      notifications7d: await safeCount('notifications', (q) => q.gte('created_at', since(7))),
    },
  })
}
