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

export default function VoiceChat(props: { roomCode: string; displayName: string }) {
  return (
    <HMSRoomProvider>
      <VoiceChatInner {...props} />
    </HMSRoomProvider>
  )
}