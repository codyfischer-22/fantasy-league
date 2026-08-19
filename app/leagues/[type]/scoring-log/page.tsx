'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

const categoryLabels: Record<string, string> = {
  team_immunity_safety: 'Immunity Safety (Team)',
  team_immunity_win: 'Immunity Win (Team)',
  individual_immunity_win: 'Immunity Win (Individual)',
  idol_found: 'Idol Found',
  successful_idol_play: 'Successful Idol Play',
  idol_in_pocket: 'Left with Idol in Pocket',
  first_off_starter_tribe: 'First Off Starter Tribe',
  first_boot: 'First Boot (Voted Off)',
  votes_against: 'Votes Against',
  survived_tribal_cycle: 'Survived Tribal Cycle',
  make_merge: 'Made the Merge',
  make_final_tribal: 'Made Final Tribal',
  sole_survivor: 'Won Sole Survivor',
  zero_vote_finalist: '0-Vote Finalist',
  manual_adjustment: 'Manual Adjustment',
}

type ScoreEntry = {
  castaway_name: string
  category: string
  points: number
  count: number
  notes: string | null
}

type EpisodeGroup = {
  episode_number: number
  entries: ScoreEntry[]
}

export default function ScoringLogPage() {
  const params = useParams()
  const type = params.type as string
  const searchParams = useSearchParams()
  const fromInstance = searchParams.get('from')
  const [leagueName, setLeagueName] = useState<string | null>(null)
  const [episodes, setEpisodes] = useState<EpisodeGroup[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const [isFrozen, setIsFrozen] = useState(false)

  useEffect(() => {
    async function loadLog() {
      if (!user && type !== 'potb-demo') {
        setPageLoading(false)
        return
      }
      if (fromInstance) {
        const { data: league } = await supabase
          .from('leagues')
          .select('name, is_frozen')
          .eq('league_type', type)
          .eq('slug', fromInstance)
          .single()
        setLeagueName(league?.name ?? null)
        setIsFrozen(league?.is_frozen ?? false)
      }
      const { data: scores } = await supabase
        .from('episode_scores')
        .select('episode_number, castaway_id, category, points, count, notes')
        .eq('league_type', type)
        .order('episode_number', { ascending: false })
      if (scores && scores.length > 0) {
        const castawayIds = [...new Set(scores.map((s) => s.castaway_id))]
        const { data: castawayList } = await supabase
          .from('castaways')
          .select('id, name')
          .in('id', castawayIds)
        const nameMap = new Map((castawayList ?? []).map((c) => [c.id, c.name]))
        const grouped: Record<number, ScoreEntry[]> = {}
        scores.forEach((s) => {
          if (!grouped[s.episode_number]) grouped[s.episode_number] = []
          grouped[s.episode_number].push({
            castaway_name: nameMap.get(s.castaway_id) ?? 'Unknown',
            category: s.category,
            points: s.points,
            count: s.count,
            notes: s.notes,
          })
        })
        const episodeGroups = Object.keys(grouped)
          .map((ep) => ({
            episode_number: parseInt(ep),
            entries: grouped[parseInt(ep)],
          }))
          .sort((a, b) => b.episode_number - a.episode_number)
        setEpisodes(episodeGroups)
      }
      setPageLoading(false)
    }
    loadLog()
  }, [type, fromInstance, user])

  if (pageLoading) {
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

  if (isFrozen) {
    return (
      <main style={{
        backgroundColor: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a0a0b0',
        fontFamily: 'Georgia, serif',
        gap: '16px',
        padding: '40px'
      }}>
        <p style={{ maxWidth: '400px', textAlign: 'center' }}>
          🚩 This league is no longer receiving updates as the host&apos;s membership dropped below Crew Chief.
        </p>
        <a href={`/leagues/${type}/${fromInstance}`} style={{ color: '#f0b429' }}>← Back to League</a>
      </main>
    )
  }

  if (!authLoading && !user && type !== 'potb-demo') {
    return (
      <main style={{
        backgroundColor: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a0a0b0',
        fontFamily: 'Georgia, serif',
        gap: '16px',
        padding: '40px'
      }}>
        <div style={{ fontSize: '2.5rem' }}>🔒</div>
        <h1 style={{ color: '#f0b429', fontSize: '1.6rem' }}>Scoring Log requires an account to view.</h1>
        <p style={{ maxWidth: '400px', textAlign: 'center' }}>
          Sign up for free to see episode-by-episode scoring breakdowns for this league.
        </p>
        <a href="/signup" style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '12px 28px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Create Free Account →
        </a>
      </main>
    )
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
        <a href={fromInstance ? `/leagues/${type}/${fromInstance}` : `/leagues/${type}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          {fromInstance ? `← Back to ${leagueName ?? 'League'}` : '← Back to Politics on the Beach'}
        </a>

        <h1 style={{ fontSize: '2.25rem', marginBottom: '8px' }}>
          🧮 <span style={{ color: '#f0b429' }}>Episode</span>{' '}
          <span style={{ color: '#ffffff' }}>Scoring Log</span>
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '32px' }}>
          Every scoring event, episode by episode, with full transparency how points were awarded:
        </p>
        {episodes.length === 0 ? (
          <p style={{ color: '#555570' }}>No episodes have been scored yet.</p>
        ) : (
          episodes.map((ep) => {
            const castawayTotals: Record<string, number> = {}
            ep.entries.forEach((entry) => {
              const total = entry.points * entry.count
              castawayTotals[entry.castaway_name] = (castawayTotals[entry.castaway_name] ?? 0) + total
            })
            const byCastaway: Record<string, ScoreEntry[]> = {}
            ep.entries.forEach((entry) => {
              if (!byCastaway[entry.castaway_name]) byCastaway[entry.castaway_name] = []
              byCastaway[entry.castaway_name].push(entry)
            })
            return (
              <div key={ep.episode_number} style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px' }}>
                  Episode {ep.episode_number}
                </h2>
                <div style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  {Object.keys(byCastaway).map((castawayName, i) => (
                    <div key={castawayName} style={{
                      padding: '14px 20px',
                      borderBottom: i < Object.keys(byCastaway).length - 1 ? '1px solid #2a2a3e' : 'none'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{castawayName}</div>
                        <div style={{
                          color: castawayTotals[castawayName] < 0 ? '#ff6b6b' : '#f0b429',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}>
                          {castawayTotals[castawayName] > 0 ? '+' : ''}{castawayTotals[castawayName]} pts
                        </div>
                      </div>
                      {byCastaway[castawayName].map((entry, idx) => (
                        <div key={idx} style={{ color: '#a0a0b0', fontSize: '0.8rem', marginTop: '2px' }}>
                          {categoryLabels[entry.category] ?? entry.category}
                          {entry.count > 1 ? ` (×${entry.count})` : ''}
                          {': '}
                          {entry.points > 0 ? '+' : ''}{entry.points}{entry.count > 1 ? ` each` : ''}
                          {entry.notes ? ` — ${entry.notes}` : ''}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}