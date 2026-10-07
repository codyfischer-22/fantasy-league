'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsLocalAudioEnabled,
} from '@100mslive/react-sdk'

function VoiceChatInner({ roomCode, displayName }: { roomCode: string; displayName: string }) {
  const hmsActions = useHMSActions()
  const isConnected = useHMSStore(selectIsConnectedToRoom)
  const peers = useHMSStore(selectPeers)
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled)
  const [joining, setJoining] = useState(false)

  const handleJoin = async () => {
    setJoining(true)
    try {
      const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode })
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
        backgroundColor: 'rgba(6, 142, 56, 0.35)', color: '#ffffff', border: '1px solid #068e38',
        padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
      }}
    >
      <span>{joining ? 'Connecting...' : '🎙️ Join Voice Chat'}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal', fontSize: '0.7rem', color: '#ffffff' }}>
        Or access chat <MessageCircle size={12} /> in header.
      </span>
    </button>
  )
}

return (
  <div style={{
    backgroundColor: 'rgba(6, 142, 56, 0.35)', border: '1px solid #068e38',
    borderRadius: '10px', padding: '14px'
  }}>
    <div style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>
      🎙️ Voice Chat ({peers.length} Connected)
    </div>
    <div style={{ display: 'flex', gap: '8px' }}>
  <button
  onClick={() => hmsActions.setLocalAudioEnabled(!isAudioOn)}
  style={{
    backgroundColor: 'transparent', color: '#2a2a3e',
    border: '1px solid #2a2a3e', padding: '8px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'
  }}
>
  {isAudioOn ? 'Mute' : 'Unmute'}
</button>
      <button
        onClick={handleLeave}
        style={{
          backgroundColor: 'transparent', color: '#2a2a3e', border: '1px solid #2a2a3e',
          padding: '8px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'
        }}
      >
                Leave Voice
      </button>
    </div>
  </div>
)
}

export default function VoiceChat(props: { roomCode: string; displayName: string }) {
  return (
    <HMSRoomProvider>
      <VoiceChatInner {...props} />
    </HMSRoomProvider>
  )
}