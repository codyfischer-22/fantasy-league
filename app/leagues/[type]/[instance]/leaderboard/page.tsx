'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trophy } from 'lucide-react'

type CastawayScore = {
  castaway_id: number
  castaway_name: string
  total: number
}
type PlayerStanding = {
  user_id: string
  display_name: string
  total: number
  bonusPoints: number
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
      const { data: customEntries } = await supabase
        .from('custom_scoring_entries')
        .select('castaway_id, points')
        .eq('league_id', league.id)
        const { data: bonusRows } = await supabase
  .from('player_bonus_points')
  .select('user_id, points')
  .eq('league_id', league.id)

const bonusByUser = new Map<string, number>()
;(bonusRows ?? []).forEach((b) => {
  const current = bonusByUser.get(b.user_id) ?? 0
  bonusByUser.set(b.user_id, current + Number(b.points))
})
      const castawayTotals = new Map<number, number>()
      ;(scores ?? []).forEach((s) => {
        const current = castawayTotals.get(s.castaway_id) ?? 0
        castawayTotals.set(s.castaway_id, current + s.points * s.count)
      })
      ;(customEntries ?? []).forEach((c) => {
        const current = castawayTotals.get(c.castaway_id) ?? 0
        castawayTotals.set(c.castaway_id, current + c.points)
      })
      const playerStandings: PlayerStanding[] = (profiles ?? []).map((profile) => {
  const userPicks = (picks ?? []).filter((p) => p.user_id === profile.user_id)
  const castawayBreakdown: CastawayScore[] = userPicks.map((p) => ({
    castaway_id: p.castaway_id,
    castaway_name: castawayNameMap.get(p.castaway_id) ?? 'Unknown',
    total: castawayTotals.get(p.castaway_id) ?? 0,
  }))
  const top3 = [...castawayBreakdown].sort((a, b) => b.total - a.total).slice(0, 3)
  const bonusPoints = bonusByUser.get(profile.user_id) ?? 0
  const playerTotal = top3.reduce((sum, c) => sum + c.total, 0) + bonusPoints
  return {
    user_id: profile.user_id,
    display_name: profile.display_name || 'Unnamed Player',
    total: playerTotal,
    bonusPoints,
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
     <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <Trophy size={36} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '0px' }} />
  <span style={{ color: '#f0b429' }}>League</span>{' '}
  <span style={{ color: '#ffffff' }}>Leaderboard</span>
</h1>
      <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '32px' }}>
  Where do you stack up on the leaderboard? Expand a player to see their {type === 'uncharted-turretory' ? 'roster' : 'tribe'} of 4!
</p>
        {standings.length === 0 ? (
          <p style={{ color: '#555570' }}>No players have joined this league yet.</p>
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
                    alignItems: 'flex-start',
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ffffff',
                    textAlign: 'left'
                  }}
                >
<div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, maxWidth: '60%' }}>                    <span style={{
                      color: index === 0 ? '#f0b429' : '#555570',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      minWidth: '28px',
                      flexShrink: 0
                    }}>
                      #{index + 1}
                    </span>
                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      {player.display_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <span style={{
                      color: player.total < 0 ? '#ff6b6b' : '#f0b429',
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}>
                      {player.total > 0 ? '+' : ''}{player.total} Pts.
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
      (() => {
        const sorted = [...player.castaways].sort((a, b) => b.total - a.total)
        const benchId = sorted[3]?.castaway_id ?? null
        return player.castaways.map((c) => {
          const isBench = c.castaway_id === benchId
          return (
            <div key={c.castaway_id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              fontSize: '0.85rem',
              color: isBench ? '#555570' : '#a0a0b0',
              opacity: isBench ? 0.6 : 1
            }}>
              <span>
                {c.castaway_name}
                {isBench && <span style={{ fontSize: '0.7rem', marginLeft: '6px' }}>(Bench)</span>}
              </span>
              <span style={{ color: isBench ? '#555570' : (c.total < 0 ? '#ff6b6b' : '#f0b429'), fontWeight: 'bold' }}>
                {c.total > 0 ? '+' : ''}{c.total} Pts.
              </span>
            </div>
          )
        })
      })()
    )}

    {player.bonusPoints > 0 && (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        fontSize: '0.85rem',
        color: '#f0b429',
        borderTop: '1px dashed #2a2a3e',
        marginTop: '4px'
      }}>
        <span>Weekly Prediction Bonus</span>
        <span style={{ fontWeight: 'bold' }}>+{player.bonusPoints} Pts.</span>
      </div>
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