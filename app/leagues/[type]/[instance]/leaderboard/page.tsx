'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type CastawayScore = {
  castaway_id: number
  castaway_name: string
  total: number
}

type PlayerStanding = {
  user_id: string
  display_name: string
  total: number
  castaways: CastawayScore[]
}

export default function LeaderboardPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string

  const [leagueName, setLeagueName] = useState('')
  const [standings, setStandings] = useState<PlayerStanding[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [isFrozen, setIsFrozen] = useState(false)

  useEffect(() => {
    async function loadLeaderboard() {
     const { data: league } = await supabase
  .from('leagues')
  .select('id, name, league_type, is_frozen')
  .eq('league_type', type)
  .eq('slug', instance)
  .single()
if (!league) {
  setPageLoading(false)
  return
}
setLeagueName(league.name)
setIsFrozen(league.is_frozen ?? false)

      const { data: members } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', league.id)

      if (!members || members.length === 0) {
        setPageLoading(false)
        return
      }

      const userIds = members.map((m) => m.user_id)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds)

      const { data: picks } = await supabase
        .from('draft_picks')
        .select('user_id, castaway_id')
        .eq('league_id', league.id)

      const castawayIds = [...new Set((picks ?? []).map((p) => p.castaway_id))]

      const { data: castawayList } = castawayIds.length > 0
        ? await supabase.from('castaways').select('id, name').in('id', castawayIds)
        : { data: [] }

      const castawayNameMap = new Map((castawayList ?? []).map((c) => [c.id, c.name]))

      const { data: scores } = castawayIds.length > 0
        ? await supabase
            .from('episode_scores')
            .select('castaway_id, points, count')
            .eq('league_type', league.league_type)
            .in('castaway_id', castawayIds)
        : { data: [] }

      const castawayTotals = new Map<number, number>()
      ;(scores ?? []).forEach((s) => {
        const current = castawayTotals.get(s.castaway_id) ?? 0
        castawayTotals.set(s.castaway_id, current + s.points * s.count)
      })

      const playerStandings: PlayerStanding[] = (profiles ?? []).map((profile) => {
        const userPicks = (picks ?? []).filter((p) => p.user_id === profile.user_id)

        const castawayBreakdown: CastawayScore[] = userPicks.map((p) => ({
          castaway_id: p.castaway_id,
          castaway_name: castawayNameMap.get(p.castaway_id) ?? 'Unknown',
          total: castawayTotals.get(p.castaway_id) ?? 0,
        }))

        const playerTotal = castawayBreakdown.reduce((sum, c) => sum + c.total, 0)

        return {
          user_id: profile.user_id,
          display_name: profile.display_name || 'Unnamed Player',
          total: playerTotal,
          castaways: castawayBreakdown,
        }
      })

      playerStandings.sort((a, b) => b.total - a.total)

      setStandings(playerStandings)
      setPageLoading(false)
    }

    loadLeaderboard()
  }, [type, instance])

  const toggleExpand = (userId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

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
      <a href={`/leagues/${type}/${instance}`} style={{ color: '#f0b429' }}>← Back to League</a>
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

        <a href={`/leagues/${type}/${instance}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to {leagueName || 'League'}
        </a>

<h1 style={{ fontSize: '2.25rem', marginBottom: '0px' }}>
  <span style={{ color: '#f0b429' }}> 🏆 League</span>{' '}
  <span style={{ color: '#ffffff' }}>Leaderboard</span>
</h1>
<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '32px' }}>
  Where do you stack up on the league leaderboard? Expand a player to see their tribe of 4!
</p>

        {standings.length === 0 ? (
          <p style={{ color: '#555570' }}>No Players have joined this league yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {standings.map((player, index) => (
              <div key={player.user_id} style={{
                backgroundColor: '#1a1a2e',
                border: index === 0 ? '2px solid #f0b429' : '1px solid #2a2a3e',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => toggleExpand(player.user_id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ffffff',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{
                      color: index === 0 ? '#f0b429' : '#555570',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      minWidth: '28px'
                    }}>
                      #{index + 1}
                    </span>
                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      {player.display_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      color: player.total < 0 ? '#ff6b6b' : '#f0b429',
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}>
                      {player.total > 0 ? '+' : ''}{player.total} pts
                    </span>
                    <span style={{ color: '#555570', fontSize: '0.8rem' }}>
                      {expanded.has(player.user_id) ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {expanded.has(player.user_id) && (
                  <div style={{
                    padding: '0 20px 16px 20px',
                    borderTop: '1px solid #2a2a3e'
                  }}>
                    {player.castaways.length === 0 ? (
                      <p style={{ color: '#555570', fontSize: '0.85rem', marginTop: '12px' }}>
                        No castaways drafted yet.
                      </p>
                    ) : (
                      player.castaways.map((c) => (
                        <div key={c.castaway_id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          fontSize: '0.85rem',
                          color: '#a0a0b0'
                        }}>
                          <span>{c.castaway_name}</span>
                          <span style={{ color: c.total < 0 ? '#ff6b6b' : '#f0b429', fontWeight: 'bold' }}>
                            {c.total > 0 ? '+' : ''}{c.total} pts
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}