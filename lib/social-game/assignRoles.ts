import { supabase } from '@/lib/supabase'
import { gameConfigByPlayerCount } from './gameConfig'


function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function assignRoles(gameId: number): Promise<{ error: string | null }> {
  const { data: players, error: fetchError } = await supabase
    .from('social_game_players')
    .select('user_id')
    .eq('game_id', gameId)
    .order('seat_order')

  if (fetchError || !players) {
    return { error: 'Could not load players to assign roles.' }
  }

  const count = players.length
const config = gameConfigByPlayerCount[count]
if (!config) {
  return { error: `Unsupported player count: ${count}. Must be 5–10 players.` }
}

const evilCount = config.badCount

  const shuffled = shuffle(players.map((p) => p.user_id))

  const badCaptain = shuffled[0]
  const badTeamMembers = shuffled.slice(1, evilCount) // remaining evil, if any
  const goodCaptain = shuffled[evilCount]
  const goodTeamMembers = shuffled.slice(evilCount + 1)

  const updates = [
    { user_id: badCaptain, role: 'badCaptain' },
    ...badTeamMembers.map((user_id) => ({ user_id, role: 'badTeamMember' })),
    { user_id: goodCaptain, role: 'goodCaptain' },
    ...goodTeamMembers.map((user_id) => ({ user_id, role: 'goodTeamMember' })),
  ]

  for (const u of updates) {
    const { error } = await supabase
      .from('social_game_players')
      .update({ role: u.role })
      .eq('game_id', gameId)
      .eq('user_id', u.user_id)

    if (error) {
      return { error: 'Something went wrong assigning roles. Please try again.' }
    }
  }

  return { error: null }
}