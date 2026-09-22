import { supabase } from '@/lib/supabase'

export async function joinGame(gameId: number, userId: string): Promise<{ error: string | null }> {
  const { data: game } = await supabase
    .from('social_games')
    .select('status')
    .eq('id', gameId)
    .single()

  if (!game || game.status !== 'lobby') {
    return { error: 'This game has already started or no longer exists.' }
  }

  const { count } = await supabase
    .from('social_game_players')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)

  if (count !== null && count >= 10) {
    return { error: 'This game is full (10 players max).' }
  }

  const { error } = await supabase.from('social_game_players').insert({
    game_id: gameId,
    user_id: userId,
    seat_order: count ?? 0,
  })

  if (error) {
    return { error: 'Something went wrong joining the game.' }
  }
  return { error: null }
}

export async function leaveGame(gameId: number, userId: string): Promise<{ error: string | null }> {
  const { data: game } = await supabase
    .from('social_games')
    .select('status')
    .eq('id', gameId)
    .single()

  if (!game || game.status !== 'lobby') {
    return { error: 'You cannot leave once the game has started.' }
  }

  const { data: myRow } = await supabase
    .from('social_game_players')
    .select('seat_order')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .single()

  if (!myRow) return { error: null } // already not in the game

  const { error: deleteError } = await supabase
    .from('social_game_players')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', userId)

  if (deleteError) {
    return { error: 'Something went wrong leaving the game.' }
  }

  // Re-sequence: shift everyone with a higher seat_order down by 1
  const { data: remaining } = await supabase
    .from('social_game_players')
    .select('user_id, seat_order')
    .eq('game_id', gameId)
    .gt('seat_order', myRow.seat_order)
    .order('seat_order')

  if (remaining && remaining.length > 0) {
    for (const player of remaining) {
      await supabase
        .from('social_game_players')
        .update({ seat_order: player.seat_order - 1 })
        .eq('game_id', gameId)
        .eq('user_id', player.user_id)
    }
  }

  return { error: null }
}

export async function checkHostEligibility(userId: string): Promise<{ canHost: boolean; freeRemaining: number | null; reason: string | null }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('user_id', userId)
    .single()

  const tier = profile?.tier ?? 'stowaway'

  if (tier === 'stowaway') {
    return {
      canHost: false,
      freeRemaining: null,
      reason: 'Stowaways can join games, but hosting requires Castaway or higher. Upgrade to start hosting.',
    }
  }

  if (tier === 'crewchief' || tier === 'teamprincipal') {
    return { canHost: true, freeRemaining: null, reason: null }
  }

  // tier === 'castaway' — gets 5 free hosting sessions total
  const { count } = await supabase
    .from('social_games')
    .select('*', { count: 'exact', head: true })
    .eq('host_user_id', userId)

  const hostedSoFar = count ?? 0
  const freeRemaining = Math.max(0, 5 - hostedSoFar)

  if (hostedSoFar < 5) {
    return { canHost: true, freeRemaining, reason: null }
  }

  return {
    canHost: false,
    freeRemaining: 0,
    reason: 'You\'ve used all 5 hosting sessions available at the Castaway tier. Upgrade to Crew Chief+ for unlimited hosting.',
  }
}

export async function createGame(
  hostUserId: string,
  skin: string,
  isPrivate: boolean
): Promise<{ gameId: number | null; error: string | null }> {
  const eligibility = await checkHostEligibility(hostUserId)
  if (!eligibility.canHost) {
    return { gameId: null, error: eligibility.reason }
  }

  const { count: sameTypeCount } = await supabase
    .from('social_games')
    .select('*', { count: 'exact', head: true })
    .eq('is_private', isPrivate)

  const displayName = `${isPrivate ? 'Private' : 'Public'} ${(sameTypeCount ?? 0) + 1}`
  const joinCode = isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : null

  const { data, error } = await supabase
    .from('social_games')
    .insert({
      host_user_id: hostUserId,
      skin,
      status: 'lobby',
      is_private: isPrivate,
      display_name: displayName,
      join_code: joinCode,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { gameId: null, error: 'Something went wrong creating the game.' }
  }

  const { error: seatError } = await supabase.from('social_game_players').insert({
    game_id: data.id,
    user_id: hostUserId,
    seat_order: 0,
  })

  if (seatError) {
    return { gameId: null, error: 'Game created, but failed to seat the host.' }
  }

  return { gameId: data.id, error: null }
}

export type OpenGame = {
  id: number
  skin: string
  is_private: boolean
  display_name: string
  player_count: number
}

export async function listOpenGames(): Promise<OpenGame[]> {
  const { data: games } = await supabase
    .from('social_games')
    .select('id, skin, is_private, display_name')
    .eq('status', 'lobby')
    .order('created_at', { ascending: false })

  if (!games || games.length === 0) return []

  const gameIds = games.map((g) => g.id)
  const { data: players } = await supabase
    .from('social_game_players')
    .select('game_id')
    .in('game_id', gameIds)

  const countMap = new Map<number, number>()
  ;(players ?? []).forEach((p) => {
    countMap.set(p.game_id, (countMap.get(p.game_id) ?? 0) + 1)
  })

  return games.map((g) => ({
    id: g.id,
    skin: g.skin,
    is_private: g.is_private,
    display_name: g.display_name,
    player_count: countMap.get(g.id) ?? 0,
  }))
}

export async function joinPrivateGame(gameId: number, code: string, userId: string): Promise<{ error: string | null }> {
  const { data: game } = await supabase
    .from('social_games')
    .select('join_code, status')
    .eq('id', gameId)
    .single()

  if (!game || game.status !== 'lobby') {
    return { error: 'This game has already started or no longer exists.' }
  }
  if (game.join_code !== code.toUpperCase().trim()) {
    return { error: 'Incorrect join code.' }
  }

  return joinGame(gameId, userId)
}