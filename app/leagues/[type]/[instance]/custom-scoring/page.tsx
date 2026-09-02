'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import ConfirmModal from '@/components/ConfirmModal'

type Castaway = {
  id: number
  name: string
}

type CustomEntry = {
  id: string
  castaway_id: number
  episode_number: number
  category_label: string
  points: number
  notes: string | null
  created_at: string
}

export default function CustomScoringPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const router = useRouter()
  const { user, loading } = useAuth()

  const [league, setLeague] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)
  const [castaways, setCastaways] = useState<Castaway[]>([])
  const [entries, setEntries] = useState<CustomEntry[]>([])
  const [castawayNames, setCastawayNames] = useState<Record<number, string>>({})
  const [selectedCastawayId, setSelectedCastawayId] = useState('')
  const [episodeNumber, setEpisodeNumber] = useState('')
  const [points, setPoints] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [newSlotText, setNewSlotText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const savedCategories = [...new Set(entries.map((e) => e.category_label))].slice(0, 3)
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setPageLoading(false)
        return
      }
      const { data: leagueData } = await supabase
  .from('leagues')
  .select('*')
  .eq('league_type', type)
  .eq('slug', instance)
  .single()

if (!leagueData || leagueData.host_user_id !== user.id || !leagueData.allow_custom_scoring) {
  router.push(`/leagues/${type}/${instance}`)
  return
}

const { data: profileData } = await supabase
  .from('profiles')
  .select('tier')
  .eq('user_id', user.id)
  .single()

if (profileData?.tier !== 'teamprincipal') {
  router.push(`/leagues/${type}/${instance}`)
  return
}

setLeague(leagueData)
setIsHost(true)

      const { data: pickRows } = await supabase
        .from('draft_picks')
        .select('castaway_id')
        .eq('league_id', leagueData.id)

      const castawayIds = [...new Set((pickRows ?? []).map((p) => p.castaway_id))]

      if (castawayIds.length > 0) {
        const { data: castawayRows } = await supabase
          .from('castaways')
          .select('id, name')
          .in('id', castawayIds)
        setCastaways(castawayRows ?? [])
        const nameMap: Record<number, string> = {}
        ;(castawayRows ?? []).forEach((c) => { nameMap[c.id] = c.name })
        setCastawayNames(nameMap)
      }

      const { data: entryRows } = await supabase
        .from('custom_scoring_entries')
        .select('*')
        .eq('league_id', leagueData.id)
        .order('episode_number', { ascending: false })
      setEntries(entryRows ?? [])

      setPageLoading(false)
    }
    if (!loading) {
      loadData()
    }
  }, [user, loading, type, instance, router])

const handleAddEntry = async () => {
  const finalCategory = selectedCategory ?? newSlotText.trim()
  if (!league || !selectedCastawayId || !episodeNumber || !finalCategory || !points) {
    setMessage('Please fill out all fields, including selecting or entering a category.')
    return
  }
  if (!selectedCategory && savedCategories.length >= 3) {
    setMessage('You already have 3 categories. Select one of the existing ones instead.')
    return
  }
  setSaving(true)
  setMessage('')

  const { data: newEntry, error } = await supabase
    .from('custom_scoring_entries')
    .insert({
      league_id: league.id,
      castaway_id: parseInt(selectedCastawayId),
      episode_number: parseInt(episodeNumber),
      category_label: finalCategory,
      points: parseInt(points),
      notes: notes.trim() || null,
    })
    .select()
    .single()

  setSaving(false)

  if (error || !newEntry) {
    setMessage('Something went wrong saving this entry. Please try again.')
    return
  }

setEntries((prev) => [newEntry, ...prev])
setMessage('Entry added!')
setSelectedCastawayId('')
setEpisodeNumber('')
setSelectedCategory(null)
setNewSlotText('')
setPoints('')
setNotes('')
}

  const handleDeleteEntry = async (entryId: string) => {
    const { error } = await supabase
      .from('custom_scoring_entries')
      .delete()
      .eq('id', entryId)
    if (error) {
      alert('Something went wrong removing this entry. Please try again.')
      return
    }
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '16px',
    borderRadius: '6px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#12121a',
    color: '#ffffff',
    fontSize: '0.9rem'
  }

  const selectStyle = {
    ...inputStyle,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f0b429' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '16px',
    paddingRight: '28px'
  }

  if (loading || pageLoading) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  if (!isHost) {
    return null
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <a href={`/leagues/${type}/${instance}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to {league?.name}
        </a>

        <h1 style={{ fontSize: '2.25rem', marginBottom: '4px' }}>
          <span style={{ color: '#f0b429' }}>🎯 Team Principal</span>{' '}
          <span style={{ color: '#ffffff' }}>Custom Scoring</span>
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '28px', lineHeight: '1.6' }}>
          Here's your chance to create up to 3 custom scoring categories for your league! Episodes with multiple tribal councils may be broken into multiple <strong>voting cycles;</strong> you are responsible for ensuring submissions match host voting cycles. Players can see these entries in the Scoring Log, alongside standard categories.
        </p>


        <div style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '10px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '16px' }}>Add Scoring Event</h2>

          <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}>Castaway</label>
          <select value={selectedCastawayId} onChange={(e) => setSelectedCastawayId(e.target.value)} style={selectStyle}>
            <option value="">Select a Castaway...</option>
            {castaways.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}> Voting Cycle Number</label>
          <input
            type="number"
            min="1"
            value={episodeNumber}
            onChange={(e) => setEpisodeNumber(e.target.value)}
            style={inputStyle}
          />
<label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '8px' }}>Scoring Category</label>
<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
  {savedCategories.map((cat) => (
    <button
      key={cat}
      type="button"
      onClick={() => { setSelectedCategory(cat); setNewSlotText('') }}
      style={{
        flex: '1 1 140px',
        padding: '10px 14px',
        borderRadius: '20px',
        border: selectedCategory === cat ? '2px solid #f0b429' : '1px solid #2a2a3e',
        backgroundColor: '#12121a',
        color: '#f0b429',
        fontSize: '0.85rem',
        textAlign: 'center',
        cursor: 'pointer'
      }}
    >
      {cat}
    </button>
  ))}
  {savedCategories.length < 3 && (
    <input
      type="text"
      value={newSlotText}
      onChange={(e) => { setNewSlotText(e.target.value); setSelectedCategory(null) }}
      onFocus={() => setSelectedCategory(null)}
      placeholder="New Category..."
      maxLength={40}
      style={{
        flex: '1 1 140px',
        padding: '10px 14px',
        borderRadius: '20px',
        border: newSlotText ? '2px solid #f0b429' : '1px solid #2a2a3e',
        backgroundColor: '#12121a',
        color: '#ffffff',
        fontSize: '0.85rem',
        textAlign: 'center'
      }}
    />
  )}
</div>

          <label style={{ display: 'block', color: '#a0a0b0', fontSize: '.85rem', marginBottom: '4px' }}>Points Awarded</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="e.g. 7 or -5"
            style={inputStyle}
          />

          <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}>Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            style={inputStyle}
          />

<button
  onClick={handleAddEntry}
  disabled={saving}
  style={{
    backgroundColor: '#f0b429',
    color: '#0a0a0f',
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 'bold',
    cursor: saving ? 'not-allowed' : 'pointer'
  }}
>
  {saving ? 'Saving...' : 'Add Entry'}
</button>

          {message && (
  <p style={{ color: message.includes('wrong') || message.includes('Please fill') ? '#ff6b6b' : '#f0b429', fontSize: '0.85rem', marginTop: '12px' }}>
    {message}
  </p>
)}
        </div>

        <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '12px' }}>Existing Entries</h2>
        {entries.length === 0 ? (
          <p style={{ color: '#555570', fontSize: '0.9rem' }}>No custom scoring entries yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} style={{
              backgroundColor: '#12121a',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.85rem' }}>
                <strong style={{ color: '#f0b429' }}>{castawayNames[entry.castaway_id] ?? 'Unknown'}</strong>
                {' | '}Voting Cycle {entry.episode_number} | {entry.category_label}: {entry.points > 0 ? '+' : ''}{entry.points}
                {entry.notes && <div style={{ color: '#a0a0b0', marginTop: '2px' }}>{entry.notes}</div>}
              </div>
             <button
  onClick={() => setDeletingEntryId(entry.id)}
  style={{
    background: 'none',
    border: '1px solid #ff6b6b',
    color: '#ff6b6b',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    cursor: 'pointer'
  }}
>
  Remove
</button>
            </div>
          ))
        )}

<ConfirmModal
  open={deletingEntryId !== null}
  title="Remove this entry?"
  message="Remove this custom scoring entry?"
  confirmText="Remove"
  danger
  onConfirm={() => {
    if (deletingEntryId) handleDeleteEntry(deletingEntryId)
    setDeletingEntryId(null)
  }}
  onCancel={() => setDeletingEntryId(null)}
/>

      </div>
    </main>
  )
}