'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { themeContentBySkin } from '@/lib/social-game/themeContent'
import { joinGame, leaveGame } from '@/lib/social-game/lobbyActions'
import { assignRoles } from '@/lib/social-game/assignRoles'
import { useRouter } from 'next/navigation'


type Player = {
  user_id: string
  seat_order: number
  display_name: string
}

type Props = {
  gameId: number
  skin: string
  hostUserId: string
  joinCode: string | null
  isPrivate: boolean
  displayName: string
  onGameStarted: () => void
}

export default function GameLobby({ gameId, skin, hostUserId, joinCode, isPrivate, displayName, onGameStarted }: Props) {  
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [starting, setStarting] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const [showWelcome, setShowWelcome] = useState(true)
  const [spectators, setSpectators] = useState<{ user_id: string; display_name: string }[]>([])

  const isHost = user?.id === hostUserId
  const theme = themeContentBySkin[skin]
  const isSeated = players.some((p) => p.user_id === user?.id)

useEffect(() => {
  if (!user) return

  async function pingAndLoadSpectators() {
    if (!isSeated) {
      await supabase.from('social_game_spectators').upsert({
        game_id: gameId,
        user_id: user!.id,
        last_seen: new Date().toISOString(),
      })
    } else {
      await supabase.from('social_game_spectators').delete().eq('game_id', gameId).eq('user_id', user!.id)
    }

    const cutoff = new Date(Date.now() - 15000).toISOString()
    const { data } = await supabase
      .from('social_game_spectators')
      .select('user_id')
      .eq('game_id', gameId)
      .gte('last_seen', cutoff)

    if (data) {
      const ids = data.map((r) => r.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', ids)
      setSpectators((profiles ?? []).map((p) => ({ user_id: p.user_id, display_name: p.display_name || 'Spectator' })))
    }
  }

  pingAndLoadSpectators()
  const interval = setInterval(pingAndLoadSpectators, 10000)
  return () => clearInterval(interval)
}, [gameId, user, isSeated])

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
  if (error) {
    setMessage(error)
    return
  }
  await supabase.from('social_game_spectators').delete().eq('game_id', gameId).eq('user_id', user.id)
}

  const handleSpectateInstead = async () => {
  if (!user) return
  setLeaving(true)
  setMessage('')
  const { error } = await leaveGame(gameId, user.id)
  setLeaving(false)
  if (error) {
    setMessage(error)
  }
  // no navigation — staying on the page; the next poll will flip isSeated to false
}

 const handleLeave = async () => {
  if (!user) return
  setLeaving(true)
  setMessage('')
  const { error } = await leaveGame(gameId, user.id)
  setLeaving(false)
  if (error) {
    setMessage(error)
    return
  }
  router.push('/social-game')
}

 const handleStart = async () => {
  if (players.length < 5 || players.length > 10) {
    setMessage('You need between 5 and 10 players to start.')
    return
  }
  setStarting(true)
  setMessage('')

  const randomLeaderSeat = Math.floor(Math.random() * players.length)

  const { error: statusError } = await supabase
    .from('social_games')
    .update({ status: 'in_progress', current_leader_seat: randomLeaderSeat })
    .eq('id', gameId)

  if (statusError) {
    setStarting(false)
    setMessage('Something went wrong starting the game. Please try again.')
    return
  }

  const { error: roleError } = await assignRoles(gameId)
  if (roleError) {
    setStarting(false)
    setMessage(roleError)
    return
  }

  setStarting(false)
  onGameStarted()
}

     return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
   <div style={{ marginBottom: '12px', textAlign: 'left' }}>
        <button
          onClick={() => router.push('/social-game')}
          style={{
            background: 'none',
            border: 'none',
            color: '#a0a0b0',
            fontSize: '0.85rem',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          ← Back to Game Lobby
        </button>
      </div>

     <h2 style={{ color: '#ffffff', fontSize: '1.4rem', marginBottom: '8px' }}>
  {theme.emoji} <span style={{ color: '#f0b429' }}>{displayName}</span> Staging Area
</h2>

{isPrivate && joinCode && (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '32px'
  }}>
    <span style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Join Code:</span>
    <span style={{
      color: '#f0b429',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      letterSpacing: '2px',
      fontFamily: 'monospace'
    }}>
      {joinCode}
    </span>
    <button
      onClick={() => {
        navigator.clipboard.writeText(joinCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      style={{
        backgroundColor: copied ? '#068e38' : 'transparent',
        color: copied ? '#ffffff' : '#f0b429',
        border: '1px solid #f0b429',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  </div>
)}


{isHost && (
  <p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '16px' }}>
    Thanks for hosting!
  </p>
)}
{!isHost && players.length > 0 && (() => {
  const hostPlayer = players.find((p) => p.user_id === hostUserId)
  return hostPlayer ? (
    <p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '16px' }}>
      Hosted by <span style={{ color: '#f0b429', fontWeight: 'bold' }}>{hostPlayer.display_name}</span>
    </p>
  ) : null
})()}

<div style={{
  backgroundColor: '#1a1a2e',
  border: '1px solid #2a2a3e',
  borderRadius: '10px',
  overflow: 'hidden',
  maxWidth: '400px',
  margin: '0 auto 24px auto',
  textAlign: 'left'
}}>
  {Array.from({ length: 10 }, (_, i) => i).map((seatNum) => {
    const occupant = players.find((p) => p.seat_order === seatNum)
    const isHostSeat = occupant?.user_id === hostUserId
    const isMeSeat = occupant?.user_id === user?.id

    return (
      <div
        key={seatNum}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: seatNum < 9 ? '1px solid #2a2a3e' : 'none',
          backgroundColor: isMeSeat ? 'rgba(240,180,41,0.08)' : 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#555570', fontSize: '0.85rem', width: '20px' }}>{seatNum + 1}.</span>
          <span style={{ color: occupant ? '#ffffff' : '#555570', fontSize: '0.9rem' }}>
            {occupant ? occupant.display_name : 'Open'}
          </span>
          {isMeSeat && (
            <span style={{ color: '#f0b429', fontSize: '0.7rem', fontWeight: 'bold' }}>(You)</span>
          )}
        </div>
      </div>
    )
  })}
</div>

{spectators.length > 0 && (
  <div style={{
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '10px',
    padding: '12px 16px',
    maxWidth: '400px',
    margin: '0 auto 24px auto',
    textAlign: 'left'
  }}>
    <div style={{ color: '#a0a0b0', fontSize: '0.8rem', marginBottom: '6px' }}>
      Spectators ({spectators.length})
    </div>
    <div style={{ color: '#555570', fontSize: '0.85rem' }}>
      {spectators.map((s) => s.display_name).join(', ')}
    </div>
  </div>
)}

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '12px' }}>
  {players.length >= 5
    ? `(${players.length}/10) - Awaiting Host Start`
    : `Waiting for players to join... (${players.length}/10)`}
</p>

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
  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '32px', marginBottom: '12px' }}>
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
        cursor: leaving ? 'not-allowed' : 'pointer'
      }}
    >
      {leaving ? 'Leaving...' : 'Leave Game'}
    </button>
    <button
      onClick={handleSpectateInstead}
      disabled={leaving}
      style={{
        backgroundColor: 'transparent',
        color: '#a0a0b0',
        border: '1px solid #2a2a3e',
        padding: '10px 24px',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        cursor: leaving ? 'not-allowed' : 'pointer'
      }}
    >
      Spectate Instead
    </button>
  </div>
)
      )}

      {isHost && players.length === 1 && (
  <button
    onClick={handleLeave}
    disabled={leaving}
    style={{
      backgroundColor: 'transparent',
      color: '#ff6b6b',
      border: '1px solid #ff6b6b',
      padding: '10px 24px',
      borderRadius: '8px',
      marginTop: '12px',
       minWidth: '160px',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      cursor: leaving ? 'not-allowed' : 'pointer'
    }}
  >
    {leaving ? 'Canceling...' : 'Cancel Game'}
  </button>
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
              marginTop: '12px',
              minWidth: '160px',
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

{showWelcome && (
  <div
    onClick={() => setShowWelcome(false)}
    style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
      padding: '20px'
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '28px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}
    >
      <p style={{ color: '#ffffff', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
        Welcome to the staging area for <strong style={{ color: '#f0b429' }}>{displayName}</strong>. You&apos;ll wait here until enough players join and your host starts the game. Catch some baddies!
      </p>
      <button
        onClick={() => setShowWelcome(false)}
        style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '10px 28px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          cursor: 'pointer'
        }}
      >
        Got it!
      </button>
    </div>
  </div>
)}

    </div>
  )
}
