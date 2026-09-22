'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { themeContentBySkin } from '@/lib/social-game/themeContent'
import { joinGame, leaveGame } from '@/lib/social-game/lobbyActions'

type Player = {
  user_id: string
  seat_order: number
  display_name: string
}

type Props = {
  gameId: number
  skin: string
  hostUserId: string
  onGameStarted: () => void
}

export default function GameLobby({ gameId, skin, hostUserId, onGameStarted }: Props) {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [starting, setStarting] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [message, setMessage] = useState('')

  const isHost = user?.id === hostUserId
  const theme = themeContentBySkin[skin]
  const isSeated = players.some((p) => p.user_id === user?.id)

  useEffect(() => {
    async function loadPlayers() {
      const { data: memberRows } = await supabase
        .from('social_game_players')
        .select('user_id, seat_order')
        .eq('game_id', gameId)
        .order('seat_order')

      if (!memberRows) return

      const userIds = memberRows.map((m) => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds)

      const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name || 'Player']))

      setPlayers(
        memberRows.map((m) => ({
          user_id: m.user_id,
          seat_order: m.seat_order,
          display_name: nameMap.get(m.user_id) ?? 'Player',
        }))
      )
    }

    loadPlayers()
    const interval = setInterval(loadPlayers, 1500)
    return () => clearInterval(interval)
  }, [gameId])

  const handleJoin = async () => {
    if (!user) return
    setJoining(true)
    setMessage('')
    const { error } = await joinGame(gameId, user.id)
    setJoining(false)
    if (error) setMessage(error)
  }

  const handleLeave = async () => {
    if (!user) return
    setLeaving(true)
    setMessage('')
    const { error } = await leaveGame(gameId, user.id)
    setLeaving(false)
    if (error) setMessage(error)
  }

  const handleStart = async () => {
    if (players.length < 5 || players.length > 10) {
      setMessage('You need between 5 and 10 players to start.')
      return
    }
    setStarting(true)
    setMessage('')

    const randomLeaderSeat = Math.floor(Math.random() * players.length)

    const { error } = await supabase
      .from('social_games')
      .update({ status: 'in_progress', current_leader_seat: randomLeaderSeat })
      .eq('id', gameId)

    setStarting(false)

    if (error) {
      setMessage('Something went wrong starting the game. Please try again.')
    } else {
      onGameStarted()
    }
  }

  const radius = 140
  const center = 160

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ color: '#f0b429', fontSize: '1.4rem', marginBottom: '8px' }}>
        {theme.emoji} {theme.displayName} Lobby
      </h2>
      <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px' }}>
        Waiting for players to join... ({players.length}/10)
      </p>

      <div style={{ position: 'relative', width: '320px', height: '320px', margin: '0 auto 32px auto' }}>
        {players.map((p, i) => {
          const angle = (360 / Math.max(players.length, 1)) * i - 90
          const radians = (angle * Math.PI) / 180
          const x = center + radius * Math.cos(radians)
          const y = center + radius * Math.sin(radians)

          return (
            <div
              key={p.user_id}
              style={{
                position: 'absolute',
                left: `${x - 40}px`,
                top: `${y - 40}px`,
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#1a1a2e',
                border: p.user_id === hostUserId ? '3px solid #f0b429' : '2px solid #2a2a3e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: '#ffffff',
                textAlign: 'center',
                padding: '4px',
                wordBreak: 'break-word'
              }}
            >
              {p.display_name}
            </div>
          )
        })}
      </div>

      {!isSeated ? (
        <div>
          <p style={{ color: '#555570', fontSize: '0.85rem', marginBottom: '12px' }}>
            You&apos;re currently just watching. Click below to join the game.
          </p>
          <button
            onClick={handleJoin}
            disabled={joining || players.length >= 10}
            style={{
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: players.length >= 10 ? 'not-allowed' : 'pointer',
              opacity: players.length >= 10 ? 0.5 : 1
            }}
          >
            {joining ? 'Joining...' : players.length >= 10 ? 'Lobby Full' : 'Join Game'}
          </button>
        </div>
      ) : (
        !isHost && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            style={{
              backgroundColor: 'transparent',
              color: '#ff6b6b',
              border: '1px solid #ff6b6b',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: leaving ? 'not-allowed' : 'pointer',
              marginBottom: '12px'
            }}
          >
            {leaving ? 'Leaving...' : 'Leave Lobby'}
          </button>
        )
      )}

      {isHost && isSeated && (
        <div>
          <button
            onClick={handleStart}
            disabled={starting || players.length < 5 || players.length > 10}
            style={{
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: players.length < 5 || players.length > 10 ? 'not-allowed' : 'pointer',
              opacity: players.length < 5 || players.length > 10 ? 0.5 : 1
            }}
          >
            {starting ? 'Starting...' : 'Start Game'}
          </button>
        </div>
      )}

      {message && (
        <p style={{ color: '#ff6b6b', fontSize: '0.9rem', marginTop: '12px' }}>{message}</p>
      )}
    </div>
  )
}
