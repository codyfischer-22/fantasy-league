'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getPlayerRecord, getReportCount, type PlayerRecord } from '@/lib/social-game/playerRecords'

type Props = {
  userId: string
  displayName: string
  enabled: boolean
  children: React.ReactNode
}

export default function PlayerRecordHover({ userId, displayName, enabled, children }: Props) {
  const [record, setRecord] = useState<PlayerRecord | null>(null)
  const [reportCount, setReportCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleEnter = async () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      setPosition({ top: rect.top - 8, left: rect.left + rect.width / 2 })
    }
    setShow(true)
    if (!enabled) return
    if (record || loading) return
    setLoading(true)
    const [r, reports] = await Promise.all([getPlayerRecord(userId), getReportCount(userId)])
    setRecord(r)
    setReportCount(reports)
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
      {show && typeof document !== 'undefined' && createPortal(
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
          {!enabled ? (
            <div style={{ color: '#a0a0b0' }}>Upgrade to see player records!</div>
          ) : (
            <>
              <div style={{ color: '#f0b429', fontWeight: 'bold', marginBottom: '4px' }}>{displayName}</div>
              {loading ? (
                <div style={{ color: '#a0a0b0' }}>Loading record...</div>
              ) : (
                <>
                  {(!record || record.totalGames === 0) ? (
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
   {reportCount !== null && reportCount > 0 && (
  <div style={{ color: '#ff6b6b', marginTop: '4px' }}>
    🚩 {reportCount} {reportCount === 1 ? 'Flag' : 'Flags'}
  </div>
)}
                </>
              )}
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}