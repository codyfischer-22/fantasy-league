'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FreeAgent } from '@/lib/freeAgents'
import { emailHostAboutJoin } from '@/lib/emailHostAboutJoin'

type Props = {
  open: boolean
  leagueId: number
  leagueName: string
  leagueSlug: string
  leagueType: string
  userId: string
  pool: FreeAgent[]
  castawayTerm: string
  requiredCount: number        // full roster for new players; number lost for returning players
  isReplacement?: boolean      // true when a returning player is replacing lost picks
  onClose: () => void
  onClaimed: () => void
}

export default function FreeAgentClaimModal({
  open,
  leagueId,
  pool,
  castawayTerm,
  requiredCount,
  isReplacement = false,
  onClose,
  onClaimed,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  if (!open) return null

  const rosterSize = Math.min(requiredCount, pool.length)
  const term = castawayTerm.toLowerCase()

  const toggleSelect = (castawayId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(castawayId)) {
        next.delete(castawayId)
      } else if (next.size < rosterSize) {
        next.add(castawayId)
      }
      return next
    })
  }

  const handleClaim = async () => {
    if (selectedIds.size !== rosterSize) {
      setMessage(`Please select exactly ${rosterSize} ${term}${rosterSize === 1 ? '' : 's'}.`)
      return
    }

    setSubmitting(true)
    setMessage('')

    const { error } = await supabase.rpc('claim_free_agents', {
      p_league_id: leagueId,
      p_castaway_ids: Array.from(selectedIds),
    })

    setSubmitting(false)

    if (error) {
      setMessage(error.message)
      return
    }

    if (!isReplacement) {
      await emailHostAboutJoin(leagueId, 'late_join')
    }

    onClaimed()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
    }}>
      <div style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '28px',
        maxWidth: '440px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        <h3 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '4px' }}>
          {isReplacement ? 'Welcome Back!' : 'Join League Post-Draft'}
        </h3>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.6' }}>
          {isReplacement
            ? `${requiredCount} of your ${term}s ${requiredCount === 1 ? 'was' : 'were'} claimed while you were away. Select ${rosterSize} replacement${rosterSize === 1 ? '' : 's'}:`
            : `This league has already drafted, but you're in luck! ${pool.length} active ${term}${pool.length === 1 ? '' : 's'} remain unclaimed. Select ${rosterSize} to build your roster:`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {pool.map((c) => {
            const isSelected = selectedIds.has(c.id)
            const isDisabled = !isSelected && selectedIds.size >= rosterSize
            return (
              <label
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? '#12121a' : 'transparent',
                  border: '1px solid #2a2a3e',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                  fontSize: '0.9rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggleSelect(c.id)}
                />
                {c.name}
                <span style={{ color: '#555570', fontSize: '0.75rem', marginLeft: 'auto' }}>
                  {c.remaining} Left
                </span>
              </label>
            )
          })}
        </div>

        <p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '16px' }}>
          Selected: {selectedIds.size} / {rosterSize}
        </p>

        {message && (
          <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '16px' }}>{message}</p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              backgroundColor: 'transparent',
              color: '#a0a0b0',
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #2a2a3e',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isReplacement ? 'Later' : 'Cancel'}
          </button>
          <button
            onClick={handleClaim}
            disabled={submitting || selectedIds.size !== rosterSize}
            style={{
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 'bold',
              cursor: (submitting || selectedIds.size !== rosterSize) ? 'not-allowed' : 'pointer',
              opacity: (submitting || selectedIds.size !== rosterSize) ? 0.5 : 1,
            }}
          >
            {submitting ? 'Saving...' : 'Confirm Roster'}
          </button>
        </div>
      </div>
    </div>
  )
}