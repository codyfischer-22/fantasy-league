'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FreeAgent } from '@/lib/freeAgents'

type Props = {
  open: boolean
  leagueId: number
  leagueName: string
  leagueSlug: string
  leagueType: string
  userId: string
  pool: FreeAgent[]
  castawayTerm: string
  onClose: () => void
  onClaimed: () => void
}

export default function FreeAgentClaimModal({
  open,
  leagueId,
  leagueName,
  leagueSlug,
  leagueType,
  userId,
  pool,
  castawayTerm,
  onClose,
  onClaimed,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  if (!open) return null

  const rosterSize = Math.min(4, pool.length)

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
      setMessage(`Please select exactly ${rosterSize} ${castawayTerm.toLowerCase()}${rosterSize === 1 ? '' : 's'}.`)
      return
    }

    setSubmitting(true)
    setMessage('')

    // Re-check each selected castaway still has room — closes the race window
    // between opening this modal and actually submitting.
    const { data: currentPicks } = await supabase
      .from('draft_picks')
      .select('castaway_id')
      .eq('league_id', leagueId)

    const { data: leagueRow } = await supabase
      .from('leagues')
      .select('base_clone_count')
      .eq('id', leagueId)
      .single()

    const draftedCounts = new Map<number, number>()
    ;(currentPicks ?? []).forEach((p) => {
      draftedCounts.set(p.castaway_id, (draftedCounts.get(p.castaway_id) ?? 0) + 1)
    })

    const stillAvailable = Array.from(selectedIds).every((id) => {
      const drafted = draftedCounts.get(id) ?? 0
      return (leagueRow?.base_clone_count ?? 0) - drafted > 0
    })

    if (!stillAvailable) {
      setSubmitting(false)
      setMessage('One of your selections was just claimed by someone else. Please pick again.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('user_id', userId)
      .single()

    const { error: memberError } = await supabase.from('league_members').insert({
      user_id: userId,
      league_id: leagueId,
      tier_at_join: profile?.tier ?? 'stowaway',
    })

    if (memberError) {
      setSubmitting(false)
      setMessage('Something went wrong joining this league. Please try again.')
      return
    }

   const { data: maxPickRow } = await supabase
  .from('draft_picks')
  .select('pick_number')
  .eq('league_id', leagueId)
  .order('pick_number', { ascending: false })
  .limit(1)
  .maybeSingle()

let nextPickNumber = (maxPickRow?.pick_number ?? 0) + 1

const pickRows = Array.from(selectedIds).map((castawayId) => ({
  league_id: leagueId,
  user_id: userId,
  castaway_id: castawayId,
  round: 5,
  pick_number: nextPickNumber++,
  original_user_id: userId,
  is_free_agent_claim: true,
}))

const { error: pickError } = await supabase.from('draft_picks').insert(pickRows)
    if (pickError) {
      setSubmitting(false)
      setMessage('Something went wrong assigning your roster. Please contact support.')
      return
    }

    setSubmitting(false)
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
          Join League Post-Draft
        </h3>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.6' }}>
          This league has already drafted, but you're in luck! {pool.length} active {castawayTerm.toLowerCase()}{pool.length === 1 ? '' : 's'} remain unclaimed. Select {rosterSize} to build your roster:
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
            Cancel
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
            {submitting ? 'Joining...' : 'Confirm Roster'}
          </button>
        </div>
      </div>
    </div>
  )
}