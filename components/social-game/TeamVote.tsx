'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { roleTermsBySkin } from '@/lib/social-game/roles'

type SeatPlayer = {
  user_id: string
  seat_order: number
  display_name: string
}

type VoteRow = {
  user_id: string
  approve: boolean
}

type Props = {
  missionId: number
  skin: string
  players: SeatPlayer[]
  proposedTeam: string[]
  leaderName: string
  myUserId: string
  onResolved: () => void
}

export default function TeamVote({ missionId, skin, players, proposedTeam, leaderName, myUserId, onResolved }: Props) {  const [votes, setVotes] = useState<VoteRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const terms = roleTermsBySkin[skin]

  const myVote = votes.find((v) => v.user_id === myUserId)
  const everyoneVoted = votes.length === players.length

  const loadVotes = async () => {
    const { data } = await supabase
      .from('social_game_team_votes')
      .select('user_id, approve')
      .eq('mission_id', missionId)
    setVotes(data ?? [])
  }

  useEffect(() => {
    loadVotes()
    const interval = setInterval(loadVotes, 1500)
    return () => clearInterval(interval)
  }, [missionId])

const castVote = async (approve: boolean) => {
  setSubmitting(true)
  const { error } = await supabase.from('social_game_team_votes').insert({
    mission_id: missionId,
    user_id: myUserId,
    approve,
  })
  setSubmitting(false)
  if (!error) {
    await loadVotes()
    await supabase.rpc('resolve_team_vote', { p_mission_id: missionId })
    onResolved()
  }
}

useEffect(() => {
  if (everyoneVoted) {
    supabase.rpc('resolve_team_vote', { p_mission_id: missionId }).then(() => onResolved())
  }
}, [everyoneVoted])

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
      <h3 style={{ color: '#f0b429', fontSize: '1.1rem', marginBottom: '8px' }}>
        {leaderName} proposed:
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        {proposedTeam.map((userId) => {
          const p = players.find((pl) => pl.user_id === userId)
          return (
            <div key={userId} style={{
              backgroundColor: '#1a1a2e', border: '1px solid #f0b429', borderRadius: '8px',
              padding: '8px 12px', color: '#ffffff', fontSize: '0.9rem'
            }}>
              {p?.display_name ?? 'Unknown'}
            </div>
          )
        })}
      </div>

      {!myVote ? (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => castVote(true)}
            disabled={submitting}
            style={{
              backgroundColor: '#068e38', color: '#ffffff', padding: '10px 24px',
              borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.95rem',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            Approve
          </button>
          <button
            onClick={() => castVote(false)}
            disabled={submitting}
            style={{
              backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b',
              padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            Reject
          </button>
        </div>
      ) : (
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px' }}>
          You voted to {myVote.approve ? 'Approve' : 'Reject'}.
        </p>
      )}

      <p style={{ color: '#555570', fontSize: '0.85rem' }}>
        {votes.length} of {players.length} players have voted.
      </p>
    </div>
  )
}