'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Castaway = {
  id: number
  name: string
  status: string
}

type CategoryDef = {
  key: string
  label: string
  points: number
  allowCount?: boolean
}

const categories: CategoryDef[] = [
  { key: 'team_immunity_safety', label: 'Immunity Safety (Team)', points: 5 },
  { key: 'team_immunity_win', label: 'Immunity Win (Team)', points: 8 },
  { key: 'individual_immunity_win', label: 'Immunity Win (Individual)', points: 15 },
  { key: 'idol_found', label: 'Acquire Idol', points: 10 },
  { key: 'successful_idol_play', label: 'Successful Idol Play', points: 15 },
  { key: 'idol_in_pocket', label: 'Idol-in-Pocket Boot', points: -20 },
  { key: 'first_off_starter_tribe', label: 'First Off Starter Tribe', points: -10 },
  { key: 'first_boot', label: 'First Vote Boot', points: -10 },
  { key: 'votes_against', label: 'Votes Against', points: -2, allowCount: true },
  { key: 'survived_tribal_cycle', label: 'Survive Tribal Cycle', points: 5 },
  { key: 'make_merge', label: 'Make the Merge', points: 10 },
  { key: 'make_final_tribal', label: 'Make Final Tribal', points: 20 },
  { key: 'sole_survivor', label: 'Win Sole Survivor', points: 25 },
  { key: 'zero_vote_finalist', label: '0-Vote Finalist', points: -10 },
]

type RowState = Record<string, number> // category key -> count (0 = not selected)

export default function ScoringAdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [castaways, setCastaways] = useState<Castaway[]>([])
  const [episodeNumber, setEpisodeNumber] = useState('')
  const [rows, setRows] = useState<Record<number, RowState>>({})
  const [manualAdjust, setManualAdjust] = useState<Record<number, { points: string; notes: string }>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setChecking(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_global_admin')
        .eq('user_id', user.id)
        .single()

      if (profile?.is_global_admin) {
        setIsAdmin(true)

        const { data: castawayList } = await supabase
          .from('castaways')
          .select('id, name, status')
          .eq('league_type', 'politics-on-the-beach')
          .order('id')

        setCastaways(castawayList ?? [])
      }

      setChecking(false)
    }

    if (!loading) {
      checkAdmin()
    }
  }, [user, loading])

  const setCategoryCount = (castawayId: number, categoryKey: string, count: number) => {
    setRows((prev) => ({
      ...prev,
      [castawayId]: {
        ...prev[castawayId],
        [categoryKey]: count,
      },
    }))
  }

  const setManualField = (castawayId: number, field: 'points' | 'notes', value: string) => {
    setManualAdjust((prev) => ({
      ...prev,
      [castawayId]: {
        ...(prev[castawayId] ?? { points: '', notes: '' }),
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    if (!episodeNumber) {
      setMessage('Enter an episode number first.')
      return
    }

    setSaving(true)
    setMessage('')

    const entries: {
      league_type: string
      season: string
      episode_number: number
      castaway_id: number
      category: string
      points: number
      count: number
      notes: string | null
    }[] = []

    for (const castaway of castaways) {
      const rowState = rows[castaway.id] ?? {}
      for (const cat of categories) {
        const count = rowState[cat.key] ?? 0
        if (count > 0) {
          entries.push({
            league_type: 'politics-on-the-beach',
            season: 'Survivor 51',
            episode_number: parseInt(episodeNumber),
            castaway_id: castaway.id,
            category: cat.key,
            points: cat.points,
            count,
            notes: null,
          })
        }
      }

      const manual = manualAdjust[castaway.id]
      if (manual && manual.points && parseInt(manual.points) !== 0) {
        entries.push({
          league_type: 'politics-on-the-beach',
          season: 'Survivor 51',
          episode_number: parseInt(episodeNumber),
          castaway_id: castaway.id,
          category: 'manual_adjustment',
          points: parseInt(manual.points),
          count: 1,
          notes: manual.notes || null,
        })
      }
    }

    if (entries.length === 0) {
      setMessage('No scoring events selected.')
      setSaving(false)
      return
    }

await supabase
  .from('episode_scores')
  .delete()
  .eq('league_type', 'politics-on-the-beach')
  .eq('episode_number', parseInt(episodeNumber))

const { error } = await supabase.from('episode_scores').insert(entries)

if (error) {
  setSaving(false)
  setMessage('Something went wrong saving. ' + error.message)
  return
}

const { data: allLeagues } = await supabase
  .from('leagues')
  .select('id')
  .eq('league_type', 'politics-on-the-beach')

const leagueIds = (allLeagues ?? []).map((l) => l.id)

const { data: allMembers } = await supabase
  .from('league_members')
  .select('user_id')
  .in('league_id', leagueIds)

const uniqueUserIds = [...new Set((allMembers ?? []).map((m) => m.user_id))]

if (uniqueUserIds.length > 0) {
  const { error: notifError } = await supabase.from('notifications').insert(
    uniqueUserIds.map((uid) => ({
      user_id: uid,
      message: `🧮 Episode ${episodeNumber} scores are in! Click here to see how you did!`,
      link: `/leagues/politics-on-the-beach/scoring-log`,
    }))
  )

  if (notifError) {
    console.error('Notification error:', notifError)
  }
}

setSaving(false)
setMessage(`Saved ${entries.length} scoring events for Episode ${episodeNumber}!`)
setRows({})
setManualAdjust({})
  }

  if (loading || checking) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  if (!user || !isAdmin) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        <p>Access Reserved for Administrators</p>
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

     <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>
  🏝️ <span style={{ color: '#f0b429' }}>Season 51</span>{' '}
  <span style={{ color: '#ffffff' }}>Episode Scoring Guide</span>
</h1>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#a0a0b0', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
            Episode Number
          </label>
          <input
            type="number"
            value={episodeNumber}
            onChange={(e) => setEpisodeNumber(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #2a2a3e',
              backgroundColor: '#12121a',
              color: '#ffffff',
              width: '100px'
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0b429' }}>
                <th style={{ padding: '8px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: '#0a0a0f' }}>Season 51 Castaway</th>
                {categories.map((cat) => (
        <th key={cat.key} style={{
  padding: '6px 4px',
  color: '#f0b429',
  minWidth: '70px',
  verticalAlign: 'bottom'
}}>
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100%',
    minHeight: '48px'
  }}>
    <div>{cat.label}</div>
    <div style={{ color: '#ffffff', marginTop: '4px' }}>
      {cat.points > 0 ? '+' : ''}{cat.points}
    </div>
  </div>
</th>
                ))}
                <th style={{ padding: '6px 4px', color: '#ff6b6b', minWidth: '100px' }}>Manual Adj.</th>
              </tr>
            </thead>
            <tbody>
              {castaways.map((castaway) => (
                <tr key={castaway.id} style={{ borderBottom: '1px solid #2a2a3e' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#0a0a0f' }}>
                    {castaway.name}
                  </td>
                  {categories.map((cat) => (
                    <td key={cat.key} style={{ padding: '6px 4px', textAlign: 'center' }}>
                      {cat.allowCount ? (
                        <input
                          type="number"
                          min="0"
                          value={rows[castaway.id]?.[cat.key] ?? ''}
                          onChange={(e) => setCategoryCount(castaway.id, cat.key, parseInt(e.target.value) || 0)}
                          style={{
                            width: '40px',
                            padding: '4px',
                            borderRadius: '4px',
                            border: '1px solid #2a2a3e',
                            backgroundColor: '#12121a',
                            color: '#ffffff',
                            textAlign: 'center'
                          }}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={(rows[castaway.id]?.[cat.key] ?? 0) > 0}
                          onChange={(e) => setCategoryCount(castaway.id, cat.key, e.target.checked ? 1 : 0)}
                        />
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '6px 4px' }}>
                    <input
                      type="number"
                      placeholder="Pts."
                      value={manualAdjust[castaway.id]?.points ?? ''}
                      onChange={(e) => setManualField(castaway.id, 'points', e.target.value)}
                      style={{
                        width: '50px',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #2a2a3e',
                        backgroundColor: '#12121a',
                        color: '#ffffff',
                        marginRight: '4px'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Note"
                      value={manualAdjust[castaway.id]?.notes ?? ''}
                      onChange={(e) => setManualField(castaway.id, 'notes', e.target.value)}
                      style={{
                        width: '80px',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #2a2a3e',
                        backgroundColor: '#12121a',
                        color: '#ffffff'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: '24px',
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '14px 32px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Episode Scores'}
        </button>

        {message && (
          <p style={{ color: '#f0b429', fontWeight: 'bold', marginTop: '16px' }}>
            {message}
          </p>
        )}

      </div>
    </main>
  )
}