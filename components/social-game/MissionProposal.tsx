'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { gameConfigByPlayerCount } from '@/lib/social-game/gameConfig'
import { roleTermsBySkin } from '@/lib/social-game/roles'

type SeatPlayer = {
  user_id: string
  seat_order: number
  display_name: string
}

type Props = {
  gameId: number
  skin: string
  players: SeatPlayer[]
  currentMission: number
  onProposed: () => void
}

export default function MissionProposal({ gameId, skin, players, currentMission, onProposed }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState('')

  const terms = roleTermsBySkin[skin]
  const config = gameConfigByPlayerCount[players.length]
  const requiredSize = config?.missions[currentMission - 1]?.size ?? 0

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else if (next.size < requiredSize) {
        next.add(userId)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size !== requiredSize) {
      setMessage(`You must select exactly ${requiredSize} players.`)
      return
    }
    setSubmitting(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      setMessage('You must be logged in.')
      return
    }

    const { error } = await supabase.from('social_game_missions').insert({
      game_id: gameId,
      mission_number: currentMission,
      leader_user_id: user.id,
      proposed_team: Array.from(selected),
    })

    setSubmitting(false)

    if (error) {
      console.error('Mission proposal failed:', JSON.stringify(error, null, 2))
      setMessage('Something went wrong proposing this team. Please try again.')
      return
    }

    setSubmitted(true)
    onProposed()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0a0a0f',
        border: '2px solid #f0b429',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#f0b429', fontSize: '1.1rem', marginBottom: '8px' }}>
          You are the {terms.missionLeader}
        </h3>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '16px' }}>
          Select exactly {requiredSize} players for {terms.mission} {currentMission}.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {players.map((p) => {
            const isChecked = selected.has(p.user_id)
            const isDisabled = !isChecked && selected.size >= requiredSize
            return (
              <label
                key={p.user_id}
                style={{
                  display: 'flex',
                  fontSize: '.85rem',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#1a1a2e',
                  border: `1px solid ${isChecked ? '#f0b429' : '#2a2a3e'}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => toggle(p.user_id)}
                />
                <span style={{ color: '#ffffff' }}>{p.display_name}</span>
              </label>
            )
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || submitted || selected.size !== requiredSize}
          style={{
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '12px 32px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: (submitting || submitted || selected.size !== requiredSize) ? 'not-allowed' : 'pointer',
            opacity: (submitting || submitted || selected.size !== requiredSize) ? 0.5 : 1
          }}
        >
          {submitted ? 'Proposed!' : submitting ? 'Proposing...' : `Propose Team (${selected.size}/${requiredSize})`}
        </button>

        {message && (
          <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '12px' }}>{message}</p>
        )}
      </div>
    </div>
  )
}