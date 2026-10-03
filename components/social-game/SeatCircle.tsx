'use client'

type SeatPlayer = {
  user_id: string
  seat_order: number
  display_name: string
}

type Props = {
  players: SeatPlayer[]
  hostUserId: string
  myUserId?: string
  onMySeatClick?: () => void
  circleSize?: number
  seatSize?: number
  currentLeaderUserId?: string
}

export default function SeatCircle({
  players,
  hostUserId,
  myUserId,
  onMySeatClick,
  circleSize = 320,
  seatSize = 80,
  currentLeaderUserId,
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

        return (
          <div
            key={p.user_id}
            onClick={isMe ? onMySeatClick : undefined}
            style={{
              position: 'absolute',
              left: `${x - seatSize / 2}px`,
              top: `${y - seatSize / 2}px`,
              width: `${seatSize}px`,
              height: `${seatSize}px`,
              borderRadius: '50%',
              backgroundColor: '#1a1a2e',
             border: isLeader
  ? '3px solid #f0b429'
  : isHost
  ? '2px solid #a0a0b0'
  : '2px solid #2a2a3e',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
fontSize: seatSize >= 100 ? '0.85rem' : seatSize >= 85 ? '0.75rem' : '0.65rem',              color: '#ffffff',
              textAlign: 'center',
              padding: '4px',
              wordBreak: 'break-word',
              cursor: isMe ? 'pointer' : 'default'
            }}
          >
            <span>{p.display_name}</span>
            {isMe && (
              <span style={{ color: '#f0b429', fontSize: '0.65rem', fontWeight: 'bold', marginTop: '2px' }}>
                View Role
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}