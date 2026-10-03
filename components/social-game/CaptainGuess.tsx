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
      <p style={{ color: '#a0a0b0', textAlign: 'center' }}>
        {terms.goodTeamMember}s have won 3 {terms.mission.toLowerCase()}s! The {terms.badCaptain} now gets one chance to guess the {terms.goodCaptain} and steal the win...
      </p>
    )
  }

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
      <h3 style={{ color: '#ff6b6b', fontSize: '1.1rem', marginBottom: '8px' }}>
        Final Chance: Who is the {terms.goodCaptain}?
      </h3>
      <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '16px' }}>
        Guess correctly and {terms.badTeamMember}s steal the win.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
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
  )
}