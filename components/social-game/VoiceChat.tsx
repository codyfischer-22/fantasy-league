'use client'

import { useEffect, useState } from 'react'
import { Mic } from 'lucide-react'
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsLocalAudioEnabled,
  selectSpeakers,
} from '@100mslive/react-sdk'

type Props = {
  roomCode: string
  displayName: string
  userId: string
  onSpeakersChange?: (userIds: string[]) => void
}

function VoiceChatInner({ roomCode, displayName, userId, onSpeakersChange }: Props) {
  const hmsActions = useHMSActions()
  const isConnected = useHMSStore(selectIsConnectedToRoom)
  const peers = useHMSStore(selectPeers)
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled)
  const [joining, setJoining] = useState(false)
  const speakers = useHMSStore(selectSpeakers)

const speakingUserIds = new Set(
  Object.values(speakers ?? {})
    .map((s) => peers.find((p) => p.id === s.peerID)?.customerUserId)
    .filter((id): id is string => Boolean(id))
)

useEffect(() => {
  console.log('Page-level speakingUserIds:', speakingUserIds)
  onSpeakersChange?.(Array.from(speakingUserIds))
}, [speakers])

 const handleJoin = async () => {
  setJoining(true)
  try {
    console.log('Joining with userId:', userId, 'roomCode:', roomCode)
    const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode, userId })
    await hmsActions.join({ userName: displayName, authToken })
  } catch (e) {
    console.error('Voice join failed:', e)
  }
  setJoining(false)
}

  const handleLeave = async () => {
    await hmsActions.leave()
  }

  useEffect(() => {
    return () => { hmsActions.leave() }
  }, [])

if (!isConnected) {
  return (
    <button
      onClick={handleJoin}
      disabled={joining}
      style={{
backgroundColor: 'rgba(202, 41, 202, 0.35)', color: '#ffffff', border: '1px solid #ca29ca',        padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
      }}
    >
      <span>{joining ? 'Connecting...' : (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
    <Mic size={16} /> Voice Chat
  </span>
)}</span>
    </button>
  )
}

return (
  <div style={{
    backgroundColor: 'rgba(202, 41, 202, 0.35)', border: '1px solid #ca29ca',
    borderRadius: '10px', padding: '14px'
  }}>

   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>
  <Mic size={16} /> Voice Chat ({peers.length} Connected)
</div>
    <div style={{ display: 'flex', gap: '8px' }}>
  <button
  onClick={() => hmsActions.setLocalAudioEnabled(!isAudioOn)}
  style={{
    backgroundColor: 'transparent', color: '#ffffff',
    border: '1px solid #a0a0b0', padding: '8px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'
  }}
>
  {isAudioOn ? 'Mute' : 'Unmute'}
</button>
      <button
        onClick={handleLeave}
        style={{
          backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #a0a0b0',
          padding: '8px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'
        }}
      >
                Leave Voice
      </button>
    </div>
  </div>
)
}

export default function VoiceChat(props: Props) {
  return (
    <HMSRoomProvider>
      <VoiceChatInner {...props} />
    </HMSRoomProvider>
  )
}