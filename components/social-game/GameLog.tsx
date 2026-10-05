'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RoleTerms } from '@/lib/social-game/roles'

type SeatPlayer = {
  user_id: string
  display_name: string
}

type MissionLogEntry = {
  id: number
  mission_number: number
  leader_user_id: string
  proposed_team: string[]
  vote_result: string | null
  mission_result: string | null
  fails_submitted: number | null
  votes: { user_id: string; approve: boolean }[]
  cards: { user_id: string; card: string }[]
}

type Props = {
  gameId: number
  players: SeatPlayer[]
  roleTerms: RoleTerms
  gameStatus: string
  captainGuessTarget: string | null
}

export default function GameLog({ gameId, players, roleTerms, gameStatus, captainGuessTarget }: Props) {
  const [entries, setEntries] = useState<MissionLogEntry[]>([])
  const [selected, setSelected] = useState<string>('')

  const nameOf = (userId: string) => players.find((p) => p.user_id === userId)?.display_name ?? 'Unknown'

  useEffect(() => {
    async function load() {
      const { data: missions } = await supabase
        .from('social_game_missions')
        .select('id, mission_number, leader_user_id, proposed_team, vote_result, mission_result, fails_submitted')
        .eq('game_id', gameId)
        .order('id')

      if (!missions) return

      const missionIds = missions.map((m) => m.id)

const { data: allVotes } = await supabase
  .from('social_game_team_votes')
  .select('mission_id, user_id, approve')
  .in('mission_id', missionIds.length > 0 ? missionIds : [0])

const { data: allCards } = await supabase
  .from('social_game_mission_cards')
  .select('mission_id, user_id, card')
  .in('mission_id', missionIds.length > 0 ? missionIds : [0])

setEntries(
  missions.map((m) => ({
    ...m,
    votes: (allVotes ?? []).filter((v) => v.mission_id === m.id),
    cards: (allCards ?? []).filter((c) => c.mission_id === m.id),
  }))
)
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [gameId])

  const missionsWithData = [1, 2, 3, 4, 5].filter((num) => entries.some((e) => e.mission_number === num))
  const captainGuessAvailable = gameStatus === 'good_wins' || gameStatus === 'evil_wins'

  const selectedAttempts = selected.startsWith('mission-')
    ? entries.filter((e) => e.mission_number === Number(selected.replace('mission-', '')))
    : []

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #2a2a3e',
      borderRadius: '10px',
      padding: '14px',
      boxSizing: 'border-box'
    }}>
      <h4 style={{ color: '#f0b429', fontSize: '0.9rem', marginBottom: '10px', textDecoration: 'underline' }}>
        Game Log
      </h4>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: '6px',
          border: '1px solid #2a2a3e',
          backgroundColor: '#12121a',
          color: '#ffffff',
          fontSize: '0.8rem',
          marginBottom: '10px'
        }}
      >
        <option value="">Select a round...</option>
        {missionsWithData.map((num) => (
          <option key={num} value={`mission-${num}`}>{roleTerms.mission} {num}</option>
        ))}
        {captainGuessAvailable && (
          <option value="captain-guess">{roleTerms.badCaptain} Guess</option>
        )}
      </select>

      {selected && (
        <div style={{
          backgroundColor: '#f5f5f0',
          color: '#1a1a2e',
          borderRadius: '6px',
          padding: '10px 12px',
          maxHeight: '220px',
          overflowY: 'auto',
          fontSize: '0.75rem',
          lineHeight: '1.5'
        }}>
          {selected === 'captain-guess' ? (
  <p>
    {captainGuessTarget ? (
      <>
        <strong>{roleTerms.badCaptain}</strong> guessed <strong>{nameOf(captainGuessTarget)}</strong>.
        <br />
        {gameStatus === 'evil_wins' ? 'Correct guess — Evil wins!' : 'Incorrect guess — Good wins!'}
      </>
    ) : (
      'No guess recorded.'
    )}
  </p>
) : (
selectedAttempts.map((attempt, i) => {
  const approvers = attempt.votes.filter((v) => v.approve).map((v) => nameOf(v.user_id))
  const rejecters = attempt.votes.filter((v) => !v.approve).map((v) => nameOf(v.user_id))
  const passCards = attempt.cards.filter((c) => c.card === 'pass').length
  const failCards = attempt.cards.filter((c) => c.card === 'fail').length

  return (
    <div key={attempt.id} style={{ marginBottom: i < selectedAttempts.length - 1 ? '14px' : 0, borderBottom: i < selectedAttempts.length - 1 ? '1px solid #d0d0c8' : 'none', paddingBottom: i < selectedAttempts.length - 1 ? '12px' : 0 }}>
      <p style={{ margin: '0 0 8px 0' }}>
  <strong>Proposal {i + 1}:</strong> {nameOf(attempt.leader_user_id)} nominates {attempt.proposed_team.map(nameOf).join(', ')}.
</p>

      {approvers.length > 0 && (
        <p style={{ margin: '0 0 8px 0' }}>
          {approvers.join(', ')} vote{approvers.length === 1 ? 's' : ''} to approve team.
        </p>
      )}

      {rejecters.length > 0 && (
        <p style={{ margin: '0 0 8px 0' }}>
          {rejecters.join(', ')} vote{rejecters.length === 1 ? 's' : ''} to reject team.
        </p>
      )}

      {attempt.vote_result === 'rejected' && i === 4 && (
  <p style={{ margin: 0, color: '#a03030', fontWeight: 'bold' }}>
    5 rejected proposals in a single {roleTerms.mission} resulted in an automatic {roleTerms.failMission}.</p>
)}

{attempt.cards.length > 0 && (
  <p style={{ margin: '0 0 8px 0' }}>
    <strong>{roleTerms.mission}:</strong> {passCards} vote{passCards === 1 ? 's' : ''} to {roleTerms.passMission} & {failCards} vote{failCards === 1 ? 's' : ''} to {roleTerms.failMission}
  </p>
)}

{attempt.mission_result && attempt.cards.length > 0 && (
  <p style={{ margin: 0, color: attempt.mission_result === 'pass' ? '#1a6b2e' : '#a03030' }}>
    <strong>Result:</strong> {attempt.mission_result === 'pass' ? roleTerms.passMission : roleTerms.failMission}
  </p>
)}
    </div>
  )
})
          )}
        </div>
      )}
    </div>
  )
}