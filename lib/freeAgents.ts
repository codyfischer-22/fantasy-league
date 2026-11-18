import { supabase } from '@/lib/supabase'

export type FreeAgent = {
  id: number
  name: string
  remaining: number
}

export async function getFreeAgentPool(leagueId: number, leagueType: string): Promise<FreeAgent[]> {
  const { data: league } = await supabase
    .from('leagues')
    .select('base_clone_count')
    .eq('id', leagueId)
    .single()

  if (!league?.base_clone_count) {
    // Draft hasn't completed (or was never frozen) — no free agent pool possible yet
    return []
  }

  const { data: castawayList } = await supabase
    .from('castaways')
    .select('id, name')
    .eq('league_type', leagueType)
    .eq('status', 'active')

  if (!castawayList || castawayList.length === 0) return []

  // Only current members' picks count; departed Players' picks are free agents again
  const { data: members } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', leagueId)
  const memberIds = new Set((members ?? []).map((m) => m.user_id))

  const { data: picks } = await supabase
    .from('draft_picks')
    .select('castaway_id, user_id')
    .eq('league_id', leagueId)

  const draftedCounts = new Map<number, number>()
  ;(picks ?? [])
    .filter((p) => memberIds.has(p.user_id))
    .forEach((p) => {
      draftedCounts.set(p.castaway_id, (draftedCounts.get(p.castaway_id) ?? 0) + 1)
    })

  const pool: FreeAgent[] = castawayList
    .map((c) => ({
      id: c.id,
      name: c.name,
      remaining: league.base_clone_count! - (draftedCounts.get(c.id) ?? 0),
    }))
    .filter((c) => c.remaining > 0)

  return pool
}