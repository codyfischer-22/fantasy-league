'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { roleTermsBySkin } from '@/lib/social-game/roles'

type SeatPlayer = {
  user_id: string
  seat_order: number
  display_name: string
  role: string
}

type Props = {
  gameId: number
  skin: string
  players: SeatPlayer[]
  myUserId: string
  myRole: string
  onGuessed: () => void
}

export default function CaptainGuess({ gameId, skin, players, myUserId, myRole, onGuessed }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const terms = roleTermsBySkin[skin]

  const isBadCaptain = myRole === 'badCaptain'

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    setMessage('')
    const { error } = await supabase.rpc('submit_captain_guess', {
      p_game_id: gameId,
      p_guessed_user_id: selected,
    })
    setSubmitting(false)
    if (error) {
      setMessage(error.message)
      return
    }
    onGuessed()
  }

  if (!isBadCaptain) {
  return (
    <>
      <p style={{ color: '#c8c8d2', fontSize: '.85rem', marginBottom: '8px', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        {terms.goodTeam} succesfully completed 3 {terms.mission}s!
      </p>
      <p style={{ color: '#c8c8d2', fontSize: '.85rem', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        But the {terms.badCaptain} can steal the win by guessing the {terms.goodCaptain}...
      </p>
    </>
  )
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
        border: '2px solid #ff6b6b',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#ff6b6b', fontSize: '1.1rem', marginBottom: '8px' }}>
          It's do or die! Who is the {terms.goodCaptain}?
        </h3>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '16px' }}>
          Guess correctly and your faction steals the win.
        </p>

        <div style={{ display: 'flex', fontSize: '.85rem', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {players
            .filter((p) => p.role !== 'badCaptain' && p.role !== 'badTeamMember')
            .map((p) => (
              <label
                key={p.user_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  backgroundColor: '#1a1a2e',
                  border: `1px solid ${selected === p.user_id ? '#f0b429' : '#2a2a3e'}`,
                  borderRadius: '8px', padding: '10px 14px', cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="captainGuess"
                  checked={selected === p.user_id}
                  onChange={() => setSelected(p.user_id)}
                />
                <span style={{ color: '#ffffff' }}>{p.display_name}</span>
              </label>
            ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !selected}
          style={{
            backgroundColor: '#ff6b6b', color: '#ffffff', padding: '12px 32px',
            borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem',
            cursor: (submitting || !selected) ? 'not-allowed' : 'pointer',
            opacity: (submitting || !selected) ? 0.5 : 1
          }}
        >
          {submitting ? 'Submitting...' : 'Lock In Guess'}
        </button>

        {message && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '12px' }}>{message}</p>}
      </div>
    </div>
  )
}