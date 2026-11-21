import { supabase } from '@/lib/supabase'

export type FinalStanding = {
  user_id: string
  display_name: string
  email: string | null
  email_opt_in: boolean
  total: number
  castawayTotals: number[] // highest first, used for the tiebreaker
}

// Same math as the Leaderboard: top 3 castaways + bonus points,
// ties broken by highest castaway, then 2nd, 3rd, then bench.
export async function getFinalStandings(leagueId: number, leagueType: string): Promise<FinalStanding[]> {
  const { data: members } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', leagueId)
  if (!members || members.length === 0) return []
  const userIds = members.map((m) => m.user_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, email, email_opt_in')
    .in('user_id', userIds)

  const { data: picks } = await supabase
    .from('draft_picks')
    .select('user_id, castaway_id')
    .eq('league_id', leagueId)

  const castawayIds = [...new Set((picks ?? []).map((p) => p.castaway_id))]
  const { data: scores } = castawayIds.length > 0
    ? await supabase
        .from('episode_scores')
        .select('castaway_id, points, count')
        .eq('league_type', leagueType)
        .in('castaway_id', castawayIds)
    : { data: [] }
  const { data: customEntries } = await supabase
    .from('custom_scoring_entries')
    .select('castaway_id, points')
    .eq('league_id', leagueId)
  const { data: bonusRows } = await supabase
    .from('player_bonus_points')
    .select('user_id, points')
    .eq('league_id', leagueId)

  const castawayTotal = new Map<number, number>()
  ;(scores ?? []).forEach((s) => {
    castawayTotal.set(s.castaway_id, (castawayTotal.get(s.castaway_id) ?? 0) + s.points * s.count)
  })
  ;(customEntries ?? []).forEach((c) => {
    castawayTotal.set(c.castaway_id, (castawayTotal.get(c.castaway_id) ?? 0) + c.points)
  })
  const bonusByUser = new Map<string, number>()
  ;(bonusRows ?? []).forEach((b) => {
    bonusByUser.set(b.user_id, (bonusByUser.get(b.user_id) ?? 0) + Number(b.points))
  })

  const standings: FinalStanding[] = (profiles ?? []).map((p) => {
    const totals = (picks ?? [])
      .filter((pick) => pick.user_id === p.user_id)
      .map((pick) => castawayTotal.get(pick.castaway_id) ?? 0)
      .sort((a, b) => b - a)
    const top3 = totals.slice(0, 3).reduce((sum, t) => sum + t, 0)
    return {
      user_id: p.user_id,
      display_name: p.display_name || 'Unnamed Player',
      email: p.email ?? null,
      email_opt_in: !!p.email_opt_in,
      total: top3 + (bonusByUser.get(p.user_id) ?? 0),
      castawayTotals: totals,
    }
  })

  standings.sort(compareStandings)
  return standings
}

export function compareStandings(a: FinalStanding, b: FinalStanding): number {
  if (b.total !== a.total) return b.total - a.total
  for (let i = 0; i < Math.max(a.castawayTotals.length, b.castawayTotals.length); i++) {
    const diff = (b.castawayTotals[i] ?? 0) - (a.castawayTotals[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

// Everyone still tied with #1 after the tiebreaker shares the title
export function getChampions(standings: FinalStanding[]): FinalStanding[] {
  if (standings.length === 0) return []
  return standings.filter((s) => compareStandings(s, standings[0]) === 0)
}