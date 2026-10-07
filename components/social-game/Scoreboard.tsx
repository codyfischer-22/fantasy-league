'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RoleTerms } from '@/lib/social-game/roles'

type Props = {
  gameId: number
  currentMission: number
  gameStatus: string
  roleTerms: RoleTerms
}

export default function Scoreboard({ gameId, currentMission, gameStatus, roleTerms }: Props) {
  const [passCount, setPassCount] = useState(0)
  const [failCount, setFailCount] = useState(0)
  const [rejectCount, setRejectCount] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: missions } = await supabase
        .from('social_game_missions')
        .select('mission_number, mission_result, vote_result')
        .eq('game_id', gameId)

      if (!missions) return
          console.log('Scoreboard debug:', { gameId, currentMission, missions })


      setPassCount(missions.filter((m) => m.mission_result === 'pass').length)
      setFailCount(missions.filter((m) => m.mission_result === 'fail').length)
      setRejectCount(
        missions.filter((m) => m.mission_number === currentMission && m.vote_result === 'rejected').length
      )
    }
    load()
    const interval = setInterval(load, 2000)
    return () => clearInterval(interval)
  }, [gameId, currentMission])

  const Dots = ({ filled, total, color }: { filled: number; total: number; color: string }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: i < filled ? color : 'transparent',
            border: `1.5px solid ${color}`
          }}
        />
      ))}
    </div>
  )

  const guessResult =
    gameStatus === 'evil_wins' ? 'Hit' :
    gameStatus === 'good_wins' ? 'Miss' :
    null

    function winVerb(teamName: string) {
  return teamName.trim().toLowerCase().endsWith('s') ? 'Win' : 'Wins'
}

    return (
<div style={{
  backgroundColor: 'rgba(26, 26, 46, 0.9)',
  border: '2px solid #f0b429',
  borderRadius: '10px',
  padding: '14px',
  boxSizing: 'border-box',
  height: '100%'
}}>
    <h4 style={{ color: '#f0b429', fontSize: '0.9rem', marginBottom: '10px', textDecoration: 'underline' }}>
  Win Conditions
</h4>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
  <span style={{ color: '#a0a0b0', fontSize: '0.75rem' }}>{roleTerms.passMission}</span>
  <Dots filled={passCount} total={3} color="#068e38" />
</div>
<p style={{ color: '#a0a0b0', opacity: 0.5, fontSize: '0.65rem', marginBottom: '8px', textAlign: 'right' }}>
  {roleTerms.goodTeam} {winVerb(roleTerms.goodTeam)}
</p>

<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
  <span style={{ color: '#a0a0b0', fontSize: '0.75rem' }}>{roleTerms.failMission}</span>
  <Dots filled={failCount} total={3} color="#ff6b6b" />
</div>
<p style={{ color: '#a0a0b0', opacity: 0.5, fontSize: '0.65rem', marginBottom: '8px', textAlign: 'right' }}>
  {roleTerms.badTeam} {winVerb(roleTerms.badTeam)}
</p>

<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
  <span style={{ color: '#a0a0b0', fontSize: '0.75rem' }}>Proposals Rejected</span>
  <Dots filled={rejectCount} total={5} color="#f0b429" />
</div>
<p style={{ color: '#a0a0b0', opacity: 0.5, fontSize: '0.65rem', marginBottom: guessResult ? '8px' : '0', textAlign: 'right' }}>
  {roleTerms.failMission} {roleTerms.mission}
</p>
      {guessResult && (
        <div style={{
          borderTop: '1px solid #2a2a3e',
          paddingTop: '8px',
          textAlign: 'center',
          color: guessResult === 'Hit' ? '#ff6b6b' : '#068e38',
          fontSize: '0.8rem',
          fontWeight: 'bold'
        }}>
          Captain Guess: {guessResult}
        </div>
      )}
    </div>
  )
}