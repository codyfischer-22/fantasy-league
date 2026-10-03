'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { roleTermsBySkin } from '@/lib/social-game/roles'

type Props = {
  missionId: number
  missionNumber: number
  skin: string
  voteResult: string | null
  missionResult: string | null
  onClose: () => void
}

export default function MissionResultModal({ missionId, missionNumber, skin, voteResult, missionResult, onClose }: Props) {
  const [passCount, setPassCount] = useState<number | null>(null)
  const [failCount, setFailCount] = useState<number | null>(null)
  const terms = roleTermsBySkin[skin]

  useEffect(() => {
    async function loadCards() {
      if (!missionResult) return
      const { data } = await supabase
        .from('social_game_mission_cards')
        .select('card')
        .eq('mission_id', missionId)
      const cards = data ?? []
      setPassCount(cards.filter((c) => c.card === 'pass').length)
      setFailCount(cards.filter((c) => c.card === 'fail').length)
    }
    loadCards()
  }, [missionId, missionResult])

  const isRejection = voteResult === 'rejected'
  const isPass = missionResult === 'pass'
  const isFail = missionResult === 'fail'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0a0a0f',
          border: `2px solid ${isFail ? '#ff6b6b' : isPass ? '#068e38' : '#555570'}`,
          borderRadius: '12px', padding: '28px', maxWidth: '420px', width: '100%', textAlign: 'center'
        }}
      >
        {isRejection ? (
          <>
            <h2 style={{ color: '#a0a0b0', fontSize: '1.3rem', marginBottom: '10px' }}>Team Rejected</h2>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>
              The proposed team for {terms.mission} {missionNumber} was voted down. Leadership passes to the next seat.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ color: isFail ? '#ff6b6b' : '#068e38', fontSize: '1.5rem', marginBottom: '10px' }}>
              {terms.mission} {missionNumber}: {isFail ? terms.failMission : terms.passMission}
            </h2>
            {passCount !== null && failCount !== null && (
              <p style={{ color: '#a0a0b0', fontSize: '0.95rem' }}>
                {passCount} {terms.passMission}{passCount === 1 ? '' : 's'}, {failCount} {terms.failMission}{failCount === 1 ? '' : 's'} submitted.
              </p>
            )}
          </>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: '20px', backgroundColor: '#f0b429', color: '#0a0a0f',
            padding: '10px 28px', borderRadius: '8px', border: 'none',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}