import { supabase } from '@/lib/supabase'

export type PlayerRecord = {
  totalGames: number
  totalWins: number
  totalLosses: number
  goodGames: number
  goodWins: number
  badGames: number
  badWins: number
}

export function canUseVoiceChat(tier: string): boolean {
  return tier !== 'stowaway'
}

export async function getReportCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('social_game_reports')
    .select('*', { count: 'exact', head: true })
    .eq('reported_user_id', userId)

  if (error) return 0
  return count ?? 0
}

export async function getPlayerRecord(userId: string): Promise<PlayerRecord | null> {
  const { data, error } = await supabase.rpc('get_player_record', { p_user_id: userId })
  if (error || !data || data.length === 0) return null
  const row = data[0]
  return {
    totalGames: row.total_games,
    totalWins: row.total_wins,
    totalLosses: row.total_losses,
    goodGames: row.good_games,
    goodWins: row.good_wins,
    badGames: row.bad_games,
    badWins: row.bad_wins,
  }
}

export async function getViewerTier(userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('tier').eq('user_id', userId).single()
  return data?.tier ?? 'stowaway'
}

export function canViewRecords(tier: string): boolean {
  return tier !== 'stowaway'
}

export function canToggleRecords(tier: string): boolean {
  return tier === 'crewchief' || tier === 'teamprincipal'
}