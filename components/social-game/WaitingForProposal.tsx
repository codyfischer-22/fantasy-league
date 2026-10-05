'use client'

type Props = {
  leaderName: string
  missionLabel: string
}

export default function WaitingForProposal({ leaderName, missionLabel }: Props) {
  return (
    <div style={{ textAlign: 'center', color: '#a0a0b0' }}>
<p style={{ fontSize: '.85rem' }}>Waiting for <strong style={{ color: '#f0b429' }}>{leaderName}</strong> to propose team for {missionLabel}.</p>    </div>
  )
}