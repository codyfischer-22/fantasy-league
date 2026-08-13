'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

type Castaway = {
  id: number
  name: string
  status: string
}

export default function RankingsPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const { user, loading } = useAuth()
  const router = useRouter()
const [alreadyDrafted, setAlreadyDrafted] = useState(false)
  const [leagueId, setLeagueId] = useState<number | null>(null)
  const [leagueName, setLeagueName] = useState('')
  const [castaways, setCastaways] = useState<Castaway[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

useEffect(() => {
  async function loadData() {
    if (!user) {
      setPageLoading(false)
      return
    }

    const { data: league } = await supabase
      .from('leagues')
      .select('id, name, league_type')
      .eq('league_type', type)
      .eq('slug', instance)
      .single()

    if (!league) {
      setPageLoading(false)
      return
    }

    const { data: membership } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', league.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      router.push(`/leagues/${type}/${instance}`)
      return
    }

    setLeagueId(league.id)
    setLeagueName(league.name)

    const { count: pickCount } = await supabase
  .from('draft_picks')
  .select('*', { count: 'exact', head: true })
  .eq('league_id', league.id)

if (pickCount && pickCount > 0) {
  setAlreadyDrafted(true)
  setLeagueId(league.id)
  setLeagueName(league.name)
  setPageLoading(false)
  return
}

    const { data: castawayList } = await supabase
        .from('castaways')
        .select('id, name, status')
        .eq('league_type', league.league_type)
        .order('id')

      const { data: existingRankings } = await supabase
        .from('draft_rankings')
        .select('castaway_id, rank_position')
        .eq('league_id', league.id)
        .eq('user_id', user.id)
        .order('rank_position')

      if (existingRankings && existingRankings.length > 0 && castawayList) {
        const rankedIds = existingRankings.map((r) => r.castaway_id)
        const rankedCastaways = rankedIds
          .map((id) => castawayList.find((c) => c.id === id))
          .filter((c): c is Castaway => !!c)
        setCastaways(rankedCastaways)
      } else {
        setCastaways(castawayList ?? [])
      }

      setPageLoading(false)
    }

    if (!loading) {
      loadData()
    }
  }, [type, instance, user, loading])

  const moveUp = (index: number) => {
    if (index === 0) return
    const updated = [...castaways]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    setCastaways(updated)
  }

  const moveDown = (index: number) => {
    if (index === castaways.length - 1) return
    const updated = [...castaways]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    setCastaways(updated)
  }

  const handleSubmit = async () => {
    if (!user || !leagueId) return
    setSaving(true)
    setMessage('')

    await supabase
      .from('draft_rankings')
      .delete()
      .eq('league_id', leagueId)
      .eq('user_id', user.id)

    const rows = castaways.map((castaway, index) => ({
      league_id: leagueId,
      user_id: user.id,
      castaway_id: castaway.id,
      rank_position: index + 1,
    }))

    const { error } = await supabase.from('draft_rankings').insert(rows)

    setSaving(false)

    if (error) {
      setMessage('Something went wrong saving your rankings. Please try again.')
    } else {
      setMessage('Your rankings have been saved!')
    }
  }

  if (loading || pageLoading) {
    return (
      <main style={{
        backgroundColor: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a0a0b0',
        fontFamily: 'Georgia, serif'
      }}>
        Loading...
      </main>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '60px 40px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <a href={`/leagues/${type}/${instance}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to {leagueName || 'League'}
        </a>

        {alreadyDrafted ? (
  <div style={{ textAlign: 'center' }}>
    <h1 style={{ color: '#f0b429', fontSize: '2rem', marginBottom: '8px' }}>
      🐍 This league has already drafted!
    </h1>
    <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px' }}>
      Rankings are locked now that the draft has run. Check out the results below!
    </p>
    
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <a href={`/leagues/${type}/${instance}/roster`} style={{
        backgroundColor: '#f0b429',
        color: '#0a0a0f',
        padding: '10px 22px',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '0.9rem'
      }}>
        View Roster →
      </a>
      <a href={`/leagues/${type}/${instance}/draft-log`} style={{
        backgroundColor: 'transparent',
        color: '#f0b429',
        border: '1px solid #f0b429',
        padding: '10px 22px',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '0.9rem'
      }}>
        View Draft Log →
      </a>
    </div>
  </div>
) : (
  <>
    <h1 style={{ color: '#f0b429', fontSize: '2rem', marginBottom: '8px' }}>
          🐍 Rank Your Castaways
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '28px', lineHeight: '1.6' }}>
          Move your most-wanted castaway to the top, using the arrows, and work your way down from there. We&apos;ll simulate the draft based on everyone&apos;s
          rankings within the draft window. Happy drafting, friends!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
          {castaways.map((castaway, index) => (
            <div key={castaway.id} style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  color: '#f0b429',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  minWidth: '24px'
                }}>
                  {index + 1}
                </span>
                <span style={{ fontSize: '0.95rem' }}>{castaway.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #2a2a3e',
                    borderRadius: '6px',
                    color: index === 0 ? '#333' : '#f0b429',
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    padding: '4px 10px',
                    fontSize: '0.9rem'
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === castaways.length - 1}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #2a2a3e',
                    borderRadius: '6px',
                    color: index === castaways.length - 1 ? '#333' : '#f0b429',
                    cursor: index === castaways.length - 1 ? 'not-allowed' : 'pointer',
                    padding: '4px 10px',
                    fontSize: '0.9rem'
                  }}
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
         
</div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
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
          {saving ? 'Saving...' : 'Save My Rankings'}
        </button>

        {message && (
          <p style={{ color: '#f0b429', fontWeight: 'bold', marginTop: '16px' }}>
            {message}
          </p>
        )}
      </>
)}
      </div>
    </main>
  )
}