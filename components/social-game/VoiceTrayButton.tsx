'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, PhoneOff } from 'lucide-react'
import {
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectPeers,
  selectSpeakers,
} from '@100mslive/react-sdk'

type Props = {
  roomCode: string
  displayName: string
  userId: string
  onSpeakersChange?: (userIds: string[]) => void
}

export default function VoiceTrayButton({ roomCode, displayName, userId, onSpeakersChange }: Props) {
  const hmsActions = useHMSActions()
  const isConnected = useHMSStore(selectIsConnectedToRoom)
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled)
  const peers = useHMSStore(selectPeers)
  const speakers = useHMSStore(selectSpeakers)
  const [busy, setBusy] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowPopover(false)
      }
    }
    if (showPopover) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPopover])

  useEffect(() => {
    const speakingUserIds = Object.values(speakers ?? {})
      .map((s) => peers.find((p) => p.id === s.peerID)?.customerUserId)
      .filter((id): id is string => Boolean(id))
    onSpeakersChange?.(speakingUserIds)
  }, [speakers])

  const handleJoin = async () => {
    if (busy) return
    setBusy(true)
    try {
      const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode, userId })
      await hmsActions.join({ userName: displayName, authToken })
    } catch (e) {
      console.error('Voice join failed:', e)
    }
    setBusy(false)
  }

  const handleToggleMute = async () => {
    await hmsActions.setLocalAudioEnabled(!isAudioOn)
    setShowPopover(false)
  }

  const handleLeave = async () => {
    await hmsActions.leave()
    setShowPopover(false)
  }

  const color = !isConnected ? '#ff6b6b' : isAudioOn ? '#2bda25' : '#f0b429'
  const label = !isConnected ? 'Voice Off' : isAudioOn ? 'Voice Live' : 'Voice Muted'

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {showPopover && (
        <div style={{
          position: 'absolute',
          bottom: '44px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '20px',
          padding: '6px',
          display: 'flex',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 260
        }}>
         <button
  onClick={handleToggleMute}
  style={{
    width: '34px', height: '34px', borderRadius: '50%', border: 'none',
    backgroundColor: 'rgba(240,180,41,0.2)',
    color: '#f0b429',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
  }}
>
  {isAudioOn ? <MicOff size={16} /> : <Mic size={16} />}
</button>
          <button
            onClick={handleLeave}
            style={{
              width: '34px', height: '34px', borderRadius: '50%', border: 'none',
              backgroundColor: 'rgba(255,107,107,0.2)', color: '#ff6b6b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <PhoneOff size={16} />
          </button>
        </div>
      )}
      <button
        onClick={() => {
          if (!isConnected) {
            handleJoin()
          } else {
            setShowPopover((v) => !v)
          }
        }}
        disabled={busy}
      >
        <Mic size={20} color={color} />
        <span>{label}</span>
      </button>
    </div>
  )
}