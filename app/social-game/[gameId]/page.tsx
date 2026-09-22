'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import GameLobby from '@/components/social-game/GameLobby'

type Game = {
  id: number
  skin: string
  status: string
  host_user_id: string
}

export default function SocialGameRoomPage() {
  const params = useParams()
  const gameId = Number(params.gameId)
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGame() {
      const { data } = await supabase
        .from('social_games')
        .select('id, skin, status, host_user_id')
        .eq('id', gameId)
        .single()
      setGame(data)
      setLoading(false)
    }
    loadGame()
  }, [gameId])

  if (loading) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  if (!game) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Game not found.
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      {game.status === 'lobby' ? (
        <GameLobby
          gameId={game.id}
          skin={game.skin}
          hostUserId={game.host_user_id}
          onGameStarted={() => setGame({ ...game, status: 'in_progress' })}
        />
      ) : (
        <p style={{ textAlign: 'center', color: '#a0a0b0' }}>
          Game in progress — the actual mission/voting screen isn&apos;t built yet!
        </p>
      )}
    </main>
  )
}