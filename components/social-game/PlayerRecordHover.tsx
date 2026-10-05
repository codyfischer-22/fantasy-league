'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getPlayerRecord, type PlayerRecord } from '@/lib/social-game/playerRecords'

type Props = {
  userId: string
  displayName: string
  enabled: boolean
  children: React.ReactNode
}

export default function PlayerRecordHover({ userId, displayName, enabled, children }: Props) {
  const [record, setRecord] = useState<PlayerRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleEnter = async () => {
    if (!enabled) return
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      setPosition({ top: rect.top - 8, left: rect.left + rect.width / 2 })
    }
    setShow(true)
    if (record || loading) return
    setLoading(true)
    const r = await getPlayerRecord(userId)
    setRecord(r)
    setLoading(false)
  }

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-block', width: '100%', height: '100%' }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {enabled && show && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, -100%)',
          backgroundColor: '#0a0a0f',
          border: '1px solid #f0b429',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '0.78rem',
          color: '#ffffff',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}>
          {loading ? (
            <div style={{ color: '#a0a0b0' }}>Loading record...</div>
          ) : !record || record.totalGames === 0 ? (
            <div style={{ color: '#a0a0b0' }}>No statistics yet.</div>
          ) : (
            <>
              <div>
                Overall: {record.totalWins}-{record.totalLosses} ({record.totalGames ? Math.round((record.totalWins / record.totalGames) * 100) : 0}%)
              </div>
              <div style={{ color: '#068e38' }}>
                Good: {record.goodWins}/{record.goodGames} ({record.goodGames ? Math.round((record.goodWins / record.goodGames) * 100) : 0}%)
              </div>
              <div style={{ color: '#ff6b6b' }}>
                Bad: {record.badWins}/{record.badGames} ({record.badGames ? Math.round((record.badWins / record.badGames) * 100) : 0}%)
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}