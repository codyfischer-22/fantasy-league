'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { roleTermsBySkin } from '@/lib/social-game/roles'

type PlayerRow = {
  user_id: string
  display_name: string
  role: string
}

type Props = {
  gameId: number
  skin: string
  myUserId: string
  onClose: () => void
}

export default function RoleReveal({ gameId, skin, myUserId, onClose }: Props) {
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [loading, setLoading] = useState(true)
  const terms = roleTermsBySkin[skin]

  useEffect(() => {
    async function load() {
      const { data: seatRows } = await supabase
        .from('social_game_players')
        .select('user_id, role')
        .eq('game_id', gameId)

      if (!seatRows) {
        setLoading(false)
        return
      }

      const userIds = seatRows.map((r) => r.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds)

      const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name || 'Player']))

      setPlayers(
        seatRows.map((r) => ({
          user_id: r.user_id,
          display_name: nameMap.get(r.user_id) ?? 'Player',
          role: r.role,
        }))
      )
      setLoading(false)
    }
    load()
  }, [gameId])

  const me = players.find((p) => p.user_id === myUserId)

  const roleLabel: Record<string, string> = terms
    ? {
        goodCaptain: terms.goodCaptain,
        badCaptain: terms.badCaptain,
        goodTeamMember: terms.goodTeamMember,
        badTeamMember: terms.badTeamMember,
      }
    : {}

  const isEvil = me?.role === 'badCaptain' || me?.role === 'badTeamMember'
  const isGoodCaptain = me?.role === 'goodCaptain'

  const evilTeammates = isEvil
    ? players.filter((p) => (p.role === 'badCaptain' || p.role === 'badTeamMember') && p.user_id !== myUserId)
    : []

  const everyoneElse = isGoodCaptain
    ? players.filter((p) => p.user_id !== myUserId)
    : []

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0a0a0f',
          border: '1px solid #2a2a3e',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#a0a0b0',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        {loading ? (
          <p style={{ color: '#a0a0b0' }}>Loading your role...</p>
        ) : !me ? (
          <p style={{ color: '#a0a0b0' }}>Could not find your seat.</p>
        ) : (
          <>
            <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '8px' }}>Your Role</h2>
            <div style={{
              backgroundColor: '#1a1a2e',
              border: `2px solid ${isEvil ? '#ff6b6b' : '#f0b429'}`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <p style={{ color: isEvil ? '#ff6b6b' : '#f0b429', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '4px' }}>
                {roleLabel[me.role]}
              </p>
              <p style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
                {isEvil ? `You are on the ${terms.badTeamMember} side.` : `You are on the ${terms.goodTeamMember} side.`}
              </p>
            </div>

            {isEvil && evilTeammates.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ color: '#ff6b6b', fontSize: '1rem', marginBottom: '10px' }}>Your fellow {terms.badTeamMember}s:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {evilTeammates.map((p) => (
                    <div key={p.user_id} style={{
                      backgroundColor: '#1a1a2e', border: '1px solid #ff6b6b', borderRadius: '8px',
                      padding: '10px', color: '#ffffff', fontSize: '0.95rem'
                    }}>
                      {p.display_name} {p.role === 'badCaptain' ? `(${terms.badCaptain})` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isGoodCaptain && (
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ color: '#f0b429', fontSize: '1rem', marginBottom: '10px' }}>You see everyone&apos;s true side:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {everyoneElse.map((p) => {
                    const theirEvil = p.role === 'badCaptain' || p.role === 'badTeamMember'
                    return (
                      <div key={p.user_id} style={{
                        backgroundColor: '#1a1a2e',
                        border: `1px solid ${theirEvil ? '#ff6b6b' : '#2a2a3e'}`,
                        borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '0.95rem',
                        display: 'flex', justifyContent: 'space-between'
                      }}>
                        <span>{p.display_name}</span>
                        <span style={{ color: theirEvil ? '#ff6b6b' : '#a0a0b0' }}>
                          {theirEvil ? terms.badTeamMember : terms.goodTeamMember}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!isEvil && !isGoodCaptain && (
              <p style={{ color: '#555570', fontSize: '0.85rem' }}>
                You don&apos;t know anyone else&apos;s role. Watch carefully and trust wisely.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}