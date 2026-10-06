import { supabase } from '@/lib/supabase'

export const REPORT_CATEGORIES = [
  'Rage-Quit',
  'Away from Keyboard',
  'Harassment',
  'Cheating / Collusion',
  'Other',
] as const

export type ReportCategory = typeof REPORT_CATEGORIES[number]

export async function submitPlayerReport(
  gameId: number,
  reporterUserId: string,
  reportedUserId: string,
  category: ReportCategory,
  details: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('social_game_reports').insert({
    game_id: gameId,
    reporter_user_id: reporterUserId,
    reported_user_id: reportedUserId,
    category,
    details: details.slice(0, 75),
  })

  if (error) {
    return { error: 'Something went wrong submitting the report.' }
  }
  return { error: null }
}