'use client'

type Props = {
  leaderName: string
  missionLabel: string
}

export default function WaitingForProposal({ leaderName, missionLabel }: Props) {
  return (
    <div style={{ textAlign: 'center', color: '#c8c8d2', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
      <p style={{ fontSize: '.85rem' }}>Waiting for <strong style={{ color: '#f0b429' }}>{leaderName}</strong> to propose team for {missionLabel}.</p>
    </div>
  )
}