'use client'

import { useRouter } from 'next/navigation'
import { roleTermsBySkin } from '@/lib/social-game/roles'

type SeatPlayer = {
  user_id: string
  seat_order: number
  display_name: string
  role: string
}

type Props = {
  skin: string
  status: string
  players: SeatPlayer[]
}

export default function GameOver({ skin, status, players }: Props) {
  const router = useRouter()
  const terms = roleTermsBySkin[skin]
  const evilWon = status === 'evil_wins'

  const roleLabel: Record<string, string> = {
    goodCaptain: terms.goodCaptain,
    badCaptain: terms.badCaptain,
    goodTeamMember: terms.goodTeamMember,
    badTeamMember: terms.badTeamMember,
  }

  return (
    <div style={{ maxWidth: '460px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ color: evilWon ? '#ff6b6b' : '#068e38', fontSize: '1.6rem', marginBottom: '8px' }}>
        {evilWon ? `${terms.badTeamMember}s Win!` : `${terms.goodTeamMember}s Win!`}
      </h2>
      <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px' }}>
        {status === 'evil_wins'
          ? `The ${terms.badCaptain} correctly identified the ${terms.goodCaptain}.`
          : `3 ${terms.mission.toLowerCase()}s succeeded, and the ${terms.badCaptain} failed to identify the ${terms.goodCaptain}.`}
      </p>

      <h3 style={{ color: '#f0b429', fontSize: '1rem', marginBottom: '10px' }}>Final Roles</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '28px' }}>
        {players.map((p) => {
          const isEvil = p.role === 'badCaptain' || p.role === 'badTeamMember'
          return (
            <div key={p.user_id} style={{
              backgroundColor: '#1a1a2e',
              border: `1px solid ${isEvil ? '#ff6b6b' : '#2a2a3e'}`,
              borderRadius: '8px', padding: '10px 14px',
              display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontSize: '0.9rem'
            }}>
              <span>{p.display_name}</span>
              <span style={{ color: isEvil ? '#ff6b6b' : '#a0a0b0' }}>{roleLabel[p.role]}</span>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => router.push('/social-game')}
        style={{
          backgroundColor: '#f0b429', color: '#0a0a0f', padding: '12px 32px',
          borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        Back to Mini-Game Home
      </button>
    </div>
  )
}