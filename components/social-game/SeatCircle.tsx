'use client'

import PlayerRecordHover from './PlayerRecordHover'

type Props = {
  players: SeatPlayer[]
  hostUserId: string
  myUserId?: string
  myRole?: string
  onMySeatClick?: () => void
  circleSize?: number
  seatSize?: number
  currentLeaderUserId?: string
  missionLeaderLabel?: string
  canViewRecords?: boolean
}

export default function SeatCircle({
  players,
  hostUserId,
  myUserId,
  myRole,
  circleSize = 320,
  seatSize = 80,
  currentLeaderUserId,
  missionLeaderLabel = 'LEADER',
  canViewRecords = false,
}: Props) {
  const center = circleSize / 2
  const radius = center - seatSize / 2

  const myIndex = myUserId ? players.findIndex((p) => p.user_id === myUserId) : -1
  const rotationOffset = myIndex >= 0 ? 180 - (360 / players.length) * myIndex : 0

  return (
    <div style={{ position: 'relative', width: `${circleSize}px`, height: `${circleSize}px`, margin: '0 auto 32px auto' }}>
      {players.map((p, i) => {
  const angle = (360 / Math.max(players.length, 1)) * i - 90 + rotationOffset
  const radians = (angle * Math.PI) / 180
  const x = center + radius * Math.cos(radians)
  const y = center + radius * Math.sin(radians)
  const isMe = p.user_id === myUserId
  const isHost = p.user_id === hostUserId
  const isLeader = p.user_id === currentLeaderUserId

  const iAmEvil = myRole === 'badTeamMember' || myRole === 'badCaptain'
  const iAmGoodCaptain = myRole === 'goodCaptain'
  const theirRoleIsEvil = p.role === 'badTeamMember' || p.role === 'badCaptain'
  const theirRoleIsGood = p.role === 'goodTeamMember' || p.role === 'goodCaptain'

let roleBorderColor: string | null = null
if (iAmEvil && theirRoleIsEvil) {
  roleBorderColor = '#ff6b6b'
} else if (iAmGoodCaptain) {
  roleBorderColor = theirRoleIsEvil ? '#ff6b6b' : theirRoleIsGood ? '#068e38' : null
} else if (myRole === 'goodTeamMember' && isMe) {
  roleBorderColor = '#068e38'
}

  const showBadCaptainGlow = iAmEvil && p.role === 'badCaptain'
  const showGoodCaptainGlow = isMe && myRole === 'goodCaptain'

return (
  <div
    key={p.user_id}
    style={{
      position: 'absolute',
      left: `${x - seatSize / 2}px`,
      top: `${y - seatSize / 2}px`,
      width: `${seatSize}px`,
      height: `${seatSize}px`,
    }}
  >
        <PlayerRecordHover userId={p.user_id} displayName={p.display_name} enabled={canViewRecords}>
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: '#1a1a2e',
        border: roleBorderColor ? `3px solid ${roleBorderColor}` : '2px solid #2a2a3e',
        boxShadow: showBadCaptainGlow
          ? '0 0 14px 4px rgba(255, 107, 107, 0.65)'
          : showGoodCaptainGlow
          ? '0 0 14px 4px rgba(6, 142, 56, 0.65)'
          : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: seatSize >= 100 ? '0.85rem' : seatSize >= 85 ? '0.75rem' : '0.65rem',
        color: '#ffffff',
        textAlign: 'center',
        padding: '4px',
        wordBreak: 'break-word',
        cursor: 'default'
      }}>
        <span>{p.display_name}</span>
      </div>
        </PlayerRecordHover>
      {isLeader && (
        <span style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(calc(-50%))',
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          fontSize: '0.55rem',
          fontWeight: 'bold',
          padding: '1px 6px',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          {missionLeaderLabel.toUpperCase()}
        </span>
      )}
    </div>
  )
})}
    </div>
  )
}