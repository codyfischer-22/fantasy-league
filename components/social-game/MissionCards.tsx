'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { roleTermsBySkin } from '@/lib/social-game/roles'

type Props = {
  missionId: number
  skin: string
  myUserId: string
  myRole: string
  isOnTeam: boolean
  onResolved: () => void
}

export default function MissionCards({ missionId, skin, myUserId, myRole, isOnTeam, onResolved }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const terms = roleTermsBySkin[skin]
  const isEvil = myRole === 'badCaptain' || myRole === 'badTeamMember'

  const submitCard = async (card: 'pass' | 'fail') => {
    setSubmitting(true)
    setMessage('')
    const { error } = await supabase.rpc('submit_mission_card', { p_mission_id: missionId, p_card: card })
    setSubmitting(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setSubmitted(true)
    onResolved()
  }

  if (!isOnTeam) {
    return (
      <p style={{ color: '#a0a0b0', textAlign: 'center' }}>
        Waiting for the team to complete {terms.mission.toLowerCase()} {missionId}...
      </p>
    )
  }

  if (submitted) {
    return <p style={{ color: '#a0a0b0', textAlign: 'center' }}>Card submitted. Waiting on your teammates...</p>
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '16px' }}>
        Choose your card for this {terms.mission.toLowerCase()}.
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={() => submitCard('pass')}
          disabled={submitting}
          style={{
            backgroundColor: '#068e38', color: '#ffffff', padding: '10px 24px',
            borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.95rem',
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          {terms.passMission}
        </button>
        {isEvil && (
          <button
            onClick={() => submitCard('fail')}
            disabled={submitting}
            style={{
              backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b',
              padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {terms.failMission}
          </button>
        )}
      </div>
      {message && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '12px' }}>{message}</p>}
    </div>
  )
}