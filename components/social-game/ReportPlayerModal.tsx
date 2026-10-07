'use client'

import { useState, useEffect } from 'react'
import { REPORT_CATEGORIES, submitPlayerReport, type ReportCategory } from '@/lib/social-game/reportPlayer'

type SeatPlayer = {
  user_id: string
  display_name: string
}

type Props = {
  gameId: number
  reporterUserId: string
  players: SeatPlayer[]
  onClose: () => void
}

export default function ReportPlayerModal({ gameId, reporterUserId, players, onClose }: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [category, setCategory] = useState<ReportCategory | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

useEffect(() => {
  if (players.length === 1) {
    setSelectedPlayer(players[0].user_id)
  }
}, [players])

  const handleSubmit = async () => {
    if (!selectedPlayer || !category) {
      setError('Please select a player and a category.')
      return
    }
    setSubmitting(true)
    setError('')
    const { error: submitError } = await submitPlayerReport(gameId, reporterUserId, selectedPlayer, category, details)
    setSubmitting(false)
    if (submitError) {
      setError(submitError)
      return
    }
    setSubmitted(true)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 400,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0a0a0f',
          border: '2px solid #ff6b6b',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        {submitted ? (
          <>
            <h3 style={{ color: '#f0b429', fontSize: '1.1rem', marginBottom: '12px' }}>Report Submitted</h3>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px' }}>
              Our team will review this reported incident.
            </p>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#f0b429', color: '#0a0a0f', padding: '10px 28px',
                borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer'
              }}
            >
              Close
            </button>
          </>
        ) : (
          <>
            <h3 style={{ color: '#ff6b6b', fontSize: '1.1rem', marginBottom: '16px' }}>Report a player</h3>

            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
  <label style={{ color: '#a0a0b0', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
    Reporting:
  </label>
  {players.length === 1 ? (
    <div style={{
      backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '6px',
      padding: '10px 12px', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold'
    }}>
      {players[0].display_name}
    </div>
  ) : (
    <select
      value={selectedPlayer ?? ''}
      onChange={(e) => setSelectedPlayer(e.target.value || null)}
      style={{
        width: '100%', padding: '8px 10px', borderRadius: '6px',
        border: '1px solid #2a2a3e', backgroundColor: '#12121a', color: '#ffffff', fontSize: '0.85rem'
      }}
    >
      <option value="">Select a player...</option>
      {players.filter((p) => p.user_id !== reporterUserId).map((p) => (
        <option key={p.user_id} value={p.user_id}>{p.display_name}</option>
      ))}
    </select>
  )}
</div>

            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label style={{ color: '#a0a0b0', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                Reason
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {REPORT_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      backgroundColor: '#1a1a2e',
                      border: `1px solid ${category === cat ? '#f0b429' : '#2a2a3e'}`,
                      borderRadius: '6px', padding: '8px 10px', cursor: 'pointer', fontSize: '0.85rem', color: '#ffffff'
                    }}
                  >
                    <input
                      type="radio"
                      name="reportCategory"
                      checked={category === cat}
                      onChange={() => setCategory(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ color: '#a0a0b0', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                Additional details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 75))}
                maxLength={75}
                rows={2}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '6px',
                  border: '1px solid #2a2a3e', backgroundColor: '#12121a', color: '#ffffff',
                  fontSize: '0.85rem', resize: 'none', boxSizing: 'border-box'
                }}
              />
              <div style={{ color: '#555570', fontSize: '0.7rem', textAlign: 'right', marginTop: '2px' }}>
                {details.length}/75
              </div>
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  backgroundColor: '#ff6b6b', color: '#ffffff', padding: '10px 24px',
                  borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent', color: '#a0a0b0', border: '1px solid #2a2a3e',
                  padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}