'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

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

type EventDetail = {
  category: string
  points: number
  count: number
  notes: string | null
}
type CastawayChartRow = {
  episode: string
  [castawayName: string]: number | string
}
type PlayerChartRow = {
  episode: string
  [playerName: string]: number | string
}
type ValuePick = {
  castaway_name: string
  rank_position: number
  points: number
  value_score: number
}
type PlayerValue = {
  player_name: string
  total_value_score: number
  total_points: number
  efficiency_percent: number
  grade: string
  best_pick: ValuePick | null
  all_picks: ValuePick[]
}

function gradeForPercent(p: number): string {
  if (p >= 95) return 'A+'
  if (p >= 90) return 'A'
  if (p >= 85) return 'B+'
  if (p >= 80) return 'B'
  if (p >= 70) return 'C'
  if (p >= 60) return 'D'
  return 'F'
}

function RankTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  const sorted = [...payload].sort((a, b) => a.value - b.value)
  return (
    <div style={{
      backgroundColor: '#12121a',
      border: '1px solid #f0b429',
      borderRadius: '8px',
      padding: '12px 16px'
    }}>
      <p style={{ color: '#f0b429', fontWeight: 'bold', marginBottom: '8px' }}>{label}</p>
      {sorted.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color, fontSize: '0.85rem', margin: '2px 0' }}>
          #{entry.value} — {entry.name}
        </p>
      ))}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  const sorted = [...payload].sort((a, b) => b.value - a.value)
  return (
    <div style={{
      backgroundColor: '#12121a',
      border: '1px solid #f0b429',
      borderRadius: '8px',
      padding: '12px 16px'
    }}>
      <p style={{ color: '#f0b429', fontWeight: 'bold', marginBottom: '8px' }}>{label}</p>
      {sorted.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color, fontSize: '0.85rem', margin: '2px 0' }}>
          {entry.name}: {entry.value} pts
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const { user, loading } = useAuth()
  const [access, setAccess] = useState<'checking' | 'granted' | 'denied'>('checking')
  const [castawayNames, setCastawayNames] = useState<string[]>([])
  const [chartData, setChartData] = useState<CastawayChartRow[]>([])
  const [eventLog, setEventLog] = useState<Record<string, EventDetail[]>>({})
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [playerChartData, setPlayerChartData] = useState<PlayerChartRow[]>([])
  const [playerSearch, setPlayerSearch] = useState('')
  const [playerHighlighted, setPlayerHighlighted] = useState<string | null>(null)
  const [valueReport, setValueReport] = useState<PlayerValue[]>([])
  const [valueSearch, setValueSearch] = useState('')
  const [leagueName, setLeagueName] = useState<string | null>(null)
  const [isFrozen, setIsFrozen] = useState(false)
  const [isPrivateLeague, setIsPrivateLeague] = useState(false)

const [isMobileWidth, setIsMobileWidth] = useState(false)

useEffect(() => {
  function checkWidth() {
    setIsMobileWidth(window.innerWidth <= 600)
  }
  checkWidth()
  window.addEventListener('resize', checkWidth)
  return () => window.removeEventListener('resize', checkWidth)
}, [])

  useEffect(() => {
    async function loadData() {
      const { data: league } = await supabase
        .from('leagues')
        .select('id, league_type, name, is_frozen, is_private')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()
      if (!league) {
        setAccess('denied')
        return
      }
      setIsFrozen(league.is_frozen ?? false)
      setIsPrivateLeague(league.is_private ?? false)
      const isDemoLeague = type === 'potb-demo'
      if (!isDemoLeague) {
        if (!user) {
          setAccess('denied')
          return
        }
        const { data: membership } = await supabase
          .from('league_members')
          .select('tier_at_join')
          .eq('league_id', league.id)
          .eq('user_id', user.id)
          .maybeSingle()
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('user_id', user.id)
          .single()
        const tier = profile?.tier ?? membership?.tier_at_join ?? 'stowaway'
        if (!membership || tier === 'stowaway') {
          setAccess('denied')
          return
        }
      }
      setAccess('granted')
      setLeagueName(league.name)
      const { data: picks } = await supabase
        .from('draft_picks')
        .select('user_id, castaway_id')
        .eq('league_id', league.id)
      const castawayIds = [...new Set((picks ?? []).map((p) => p.castaway_id))]
      if (castawayIds.length === 0) return
      const { data: castawayList } = await supabase
        .from('castaways')
        .select('id, name')
        .in('id', castawayIds)
      const nameMap = new Map((castawayList ?? []).map((c) => [c.id, c.name]))
      const names = (castawayList ?? []).map((c) => c.name)
      setCastawayNames(names)
      const { data: rawScores } = await supabase
        .from('episode_scores')
        .select('episode_number, castaway_id, category, points, count, notes')
        .eq('league_type', league.league_type)
        .in('castaway_id', castawayIds)
        .order('episode_number')
      const { data: customEntries } = await supabase
        .from('custom_scoring_entries')
        .select('episode_number, castaway_id, category_label, points, notes')
        .eq('league_id', league.id)
      const customAsScores = (customEntries ?? []).map((c) => ({
        episode_number: c.episode_number,
        castaway_id: c.castaway_id,
        category: c.category_label,
        points: c.points,
        count: 1,
        notes: c.notes,
      }))
      const scores = [...(rawScores ?? []), ...customAsScores].sort(
        (a, b) => a.episode_number - b.episode_number
      )
      if (!scores || scores.length === 0) return
      const episodeNumbers = [...new Set(scores.map((s) => s.episode_number))].sort((a, b) => a - b)
      const runningTotals: Record<string, number> = {}
      names.forEach((n) => (runningTotals[n] = 0))
      const rows: CastawayChartRow[] = []
      const log: Record<string, EventDetail[]> = {}
      episodeNumbers.forEach((ep) => {
        const epScores = scores.filter((s) => s.episode_number === ep)
        epScores.forEach((s) => {
          const name = nameMap.get(s.castaway_id)
          if (!name) return
          runningTotals[name] += s.points * s.count
          const key = `${name}|Ep${ep}`
          if (!log[key]) log[key] = []
          log[key].push({
            category: s.category,
            points: s.points,
            count: s.count,
            notes: s.notes,
          })
        })
        const row: CastawayChartRow = { episode: `TC ${ep}` }
        names.forEach((n) => {
          row[n] = runningTotals[n]
        })
        rows.push(row)
      })
      setChartData(rows)
      setEventLog(log)
      const { data: members } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', league.id)
      if (members && members.length > 0) {
        const memberIds = members.map((m) => m.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', memberIds)
        const playerNameMap = new Map(
          (profiles ?? []).map((p) => [p.user_id, p.display_name || 'Unnamed Player'])
        )
        const pNames = (profiles ?? []).map((p) => playerNameMap.get(p.user_id) as string)
        setPlayerNames(pNames)
        const { data: rankings } = await supabase
          .from('draft_rankings')
          .select('user_id, castaway_id, rank_position')
          .eq('league_id', league.id)
        if (rankings && rankings.length > 0) {
          const rankMap = new Map(
            rankings.map((r) => [`${r.user_id}-${r.castaway_id}`, r.rank_position])
          )
          const castawayPointsMap = new Map<number, number>()
          scores.forEach((s) => {
            const current = castawayPointsMap.get(s.castaway_id) ?? 0
            castawayPointsMap.set(s.castaway_id, current + s.points * s.count)
          })
          const valueByPlayer = new Map<string, ValuePick[]>()
          ;(picks ?? []).forEach((p) => {
            const rank = rankMap.get(`${p.user_id}-${p.castaway_id}`)
            if (!rank) return
            const points = castawayPointsMap.get(p.castaway_id) ?? 0
            const castawayName = nameMap.get(p.castaway_id) ?? 'Unknown'
            const pick: ValuePick = {
              castaway_name: castawayName,
              rank_position: rank,
              points,
              value_score: points * rank,
            }
            const existing = valueByPlayer.get(p.user_id) ?? []
            existing.push(pick)
            valueByPlayer.set(p.user_id, existing)
          })
          const rawReport = Array.from(valueByPlayer.entries()).map(([uid, picksForPlayer]) => {
            const sorted = [...picksForPlayer].sort((a, b) => b.value_score - a.value_score)
            const totalValue = picksForPlayer.reduce((sum, p) => sum + p.value_score, 0)
            const totalPoints = picksForPlayer.reduce((sum, p) => sum + p.points, 0)
            return {
              player_name: playerNameMap.get(uid) ?? 'Unnamed Player',
              total_value_score: totalValue,
              total_points: totalPoints,
              best_pick: sorted[0] ?? null,
              all_picks: sorted,
            }
          })
          const maxScore = Math.max(...rawReport.map((r) => r.total_value_score), 1)
          const report: PlayerValue[] = rawReport.map((r) => {
            const pct = Math.max(0, Math.min(100, Math.round((r.total_value_score / maxScore) * 100)))
            return {
              ...r,
              efficiency_percent: pct,
              grade: gradeForPercent(pct),
            }
          })
          report.sort((a, b) => b.total_value_score - a.total_value_score)
          setValueReport(report)
        }
        const castawayOwner = new Map(
          (picks ?? []).map((p) => [p.castaway_id, p.user_id])
        )
        const playerRunningTotals: Record<string, number> = {}
        pNames.forEach((n) => (playerRunningTotals[n] = 0))
        const playerRows: PlayerChartRow[] = []
        episodeNumbers.forEach((ep) => {
          const epScores = scores.filter((s) => s.episode_number === ep)
          epScores.forEach((s) => {
            const ownerId = castawayOwner.get(s.castaway_id)
            if (!ownerId) return
            const playerName = playerNameMap.get(ownerId)
            if (!playerName) return
            playerRunningTotals[playerName] += s.points * s.count
          })
          const ranked = [...pNames].sort(
            (a, b) => playerRunningTotals[b] - playerRunningTotals[a]
          )
          const row: PlayerChartRow = { episode: `TC ${ep}` }
          ranked.forEach((name, idx) => {
            row[name] = idx + 1
          })
          playerRows.push(row)
        })
        setPlayerChartData(playerRows)
      }
    }
    if (!loading) {
      loadData()
    }
  }, [type, instance, user, loading])

  const colorForIndex = (i: number) => {
    const palette = ['#f0b429', '#ff6b6b', '#4ecdc4', '#a78bfa', '#f472b6', '#60a5fa', '#fbbf24', '#34d399']
    return palette[i % palette.length]
  }
  const filteredNames = search
    ? castawayNames.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    : castawayNames
  const top5 = valueReport.slice(0, 5)
  const searchedPlayer = valueSearch
    ? valueReport.find((r) => r.player_name.toLowerCase().includes(valueSearch.toLowerCase()))
    : null
  const searchedIsInTop5 = searchedPlayer
    ? top5.some((r) => r.player_name === searchedPlayer.player_name)
    : false

  if (loading || access === 'checking') {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  if (access === 'denied') {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif', gap: '16px', padding: '40px' }}>
        <div style={{ fontSize: '2.5rem' }}>🔒</div>
        <h1 style={{ color: '#f0b429', fontSize: '1.6rem' }}>Analytics is a Castaway+ perk.</h1>
        <p style={{ maxWidth: '400px', textAlign: 'center' }}>
          Upgrade your membership to unlock full-season analytics and track every player and castaway&apos;s journey week by week.
        </p>
        <a href="/account" className="btn" style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '12px 28px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Upgrade Membership →
        </a>
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
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <a href={`/leagues/${type}/${instance}`} style={{
          color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px'
        }}>
          ← Back to {leagueName ?? 'League'}
        </a>
        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '4px' }}>
          📈 <span style={{ color: '#f0b429' }}>Season 51</span>{' '}
          <span style={{ color: '#ffffff' }}>Analytics</span>
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '36px' }}>
          Paid members get exclusive access to league analytic charts to visual process along the way! Please note episodes with more than one tribal council (e.g. premiere or finale) may be broken down into multiple "voting cycles" below.
        </p>

        {!isPrivateLeague && (
          <>
            <h2 style={{ color: '#f0b429', fontSize: '1.5rem', marginBottom: '4px', textAlign: 'left' }}>
              Draft Value Report
            </h2>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'left' }}>
              Ready to see your report card for Draft School? Your grade rewards squeezing big points out of low-ranked picks. This grade is measured against the best value roster in the league so it can shift as the season plays out.
            </p>
            {valueReport.length === 0 ? (
              <p style={{ color: '#555570', marginBottom: '48px' }}>
                No draft rankings on record yet. Check back once the draft has run!
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {top5.map((pv, idx) => (
              <div key={pv.player_name} className="draft-value-card" style={{
  backgroundColor: '#1a1a2e',
  border: idx === 0 ? '2px solid #f0b429' : '1px solid #2a2a3e',
  borderRadius: '10px',
  padding: '16px 20px'
}}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: idx === 0 ? '#f0b429' : '#555570', fontWeight: 'bold', fontSize: '1rem', minWidth: '24px', flexShrink: 0 }}>
                            #{idx + 1}
                          </span>
                          <span style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap' }}>{pv.player_name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <span style={{
  backgroundColor: '#12121a',
  color: '#f0b429',
  padding: '4px 8px',
  borderRadius: '20px',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  width: '40px',
  textAlign: 'center',
  display: 'inline-block',
  boxSizing: 'border-box'
}}>
  {pv.grade}
</span>
                          <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>{pv.efficiency_percent}%</span>
                        </div>
                      </div>
                      {pv.best_pick && (
                        <p style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
                          Best pick: <strong style={{ color: '#ffffff' }}>{pv.best_pick.castaway_name}</strong>
                          <span className="best-pick-break">{' '}</span>
                          (Ranked #{pv.best_pick.rank_position}, {pv.best_pick.points > 0 ? '+' : ''}{pv.best_pick.points} Pts.)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
               <input
  className="search-input-glow"
  type="text"
  placeholder={isMobileWidth ? "Search a Player..." : "Didn't crack the Top 5 in draft efficiency? Search here to see where you stack up!"}
  value={valueSearch}
  onChange={(e) => setValueSearch(e.target.value)}
  style={{
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    marginBottom: searchedPlayer && !searchedIsInTop5 ? '10px' : '48px',
    fontSize: '0.9rem'
  }}
/>
                {searchedPlayer && !searchedIsInTop5 && (
                  <div style={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #f0b429',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    marginBottom: '48px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap' }}>{searchedPlayer.player_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <span style={{
                          backgroundColor: '#12121a',
                          color: '#f0b429',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}>
                          {searchedPlayer.grade}
                        </span>
                        <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>{searchedPlayer.efficiency_percent}%</span>
                      </div>
                    </div>
                    {searchedPlayer.best_pick && (
                      <p style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
                        Best Pick: <strong style={{ color: '#ffffff' }}>{searchedPlayer.best_pick.castaway_name}</strong>
                        {' '}(ranked #{searchedPlayer.best_pick.rank_position}, {searchedPlayer.best_pick.points > 0 ? '+' : ''}{searchedPlayer.best_pick.points} pts)
                      </p>
                    )}
                  </div>
                )}
                {valueSearch && !searchedPlayer && (
                  <p style={{ color: '#555570', fontSize: '0.85rem', marginBottom: '48px' }}>
                    No player found matching. &quot;{valueSearch}&quot;.
                  </p>
                )}
              </>
            )}
          </>
        )}

        <h2 style={{ color: '#f0b429', fontSize: '1.5rem', marginBottom: '2px', textAlign: 'left' }}>
          Player Standings
        </h2>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'left' }}>
          Tracking week-to-week player&apos; rankings, with the pack leader topping the chart!
        </p>
        <input
          className="search-input-glow"
          type="text"
          placeholder="Search a Player..."
          value={playerSearch}
          onChange={(e) => {
            setPlayerSearch(e.target.value)
            setPlayerHighlighted(null)
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #2a2a3e',
            backgroundColor: '#1a1a2e',
            color: '#ffffff',
            marginBottom: '16px',
            fontSize: '0.9rem'
          }}
        />
        <p className="mobile-rotate-hint" style={{
          color: '#555570',
          fontSize: '1rem',
          textAlign: 'center',
          marginBottom: '26px',
          marginTop: '10px',
        }}>
          Rotate 📱 for a better view!
        </p>
        {playerChartData.length === 0 ? (
  <p style={{ color: '#555570' }}>No scoring data on record yet. Check back once episodes have been scored!</p>
) : (
  <>
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #2a2a3e',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '48px'
    }}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={playerChartData} margin={{ bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
          <XAxis dataKey="episode" stroke="#a0a0b0" fontSize={12} dy={8} />
          <YAxis stroke="#a0a0b0" fontSize={12} reversed domain={[1, playerNames.length]} allowDecimals={false} />
          <Tooltip content={<RankTooltip />} />
          {playerNames.map((name, i) => {
            const filteredPlayerNames = playerSearch
              ? playerNames.filter((n) => n.toLowerCase().includes(playerSearch.toLowerCase()))
              : playerNames
            const isMatch = filteredPlayerNames.includes(name)
            const isHighlighted = playerHighlighted === name
            const dimmed = playerSearch && !isMatch
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={colorForIndex(i)}
                strokeWidth={isHighlighted || (playerSearch && isMatch) ? 3 : 1.5}
                strokeOpacity={dimmed ? 0.15 : 1}
                dot={false}
                onClick={() => setPlayerHighlighted(name)}
                style={{ cursor: 'pointer' }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
    {playerSearch && playerNames.filter((n) => n.toLowerCase().includes(playerSearch.toLowerCase())).length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '40px' }}>
        {playerNames
          .filter((n) => n.toLowerCase().includes(playerSearch.toLowerCase()))
          .map((name) => (
            <span key={name} style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #f0b429',
              color: '#f0b429',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.85rem'
            }}>
              {name}
            </span>
          ))}
      </div>
    )}
  </>
)}

        <h2 style={{ color: '#f0b429', fontSize: '1.5rem', marginTop: '32px', marginBottom: '2px', textAlign: 'left' }}>
          Castaway Standings
        </h2>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'left' }}>
          Tracking week-to-week castaway point totals. Search a name to highlight their points journey!
        </p>
        <input
          className="search-input-glow"
          type="text"
          placeholder="Search a Castaway..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setHighlighted(null)
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #2a2a3e',
            backgroundColor: '#1a1a2e',
            color: '#ffffff',
            marginBottom: '16px',
            fontSize: '0.9rem'
          }}
        />
        <p className="mobile-rotate-hint" style={{
          color: '#555570',
          fontSize: '1rem',
          textAlign: 'center',
          marginBottom: '26px',
          marginTop: '10px',
        }}>
          Rotate 📱 for a better view!
        </p>
        {chartData.length === 0 ? (
          <p style={{ color: '#555570' }}>No scoring data on record yet. Check back once episodes have been scored!</p>
        ) : (
          <>
            <div style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #2a2a3e',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="episode" stroke="#a0a0b0" fontSize={12} dy={8} />
                  <YAxis stroke="#a0a0b0" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  {castawayNames.map((name, i) => {
                    const isMatch = filteredNames.includes(name)
                    const isHighlighted = highlighted === name
                    const dimmed = search && !isMatch
                    return (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={colorForIndex(i)}
                        strokeWidth={isHighlighted || (search && isMatch) ? 3 : 1.5}
                        strokeOpacity={dimmed ? 0.15 : 1}
                        dot={false}
                        onClick={() => setHighlighted(name)}
                        style={{ cursor: 'pointer' }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {search && filteredNames.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {filteredNames.map((name) => (
                  <span key={name} style={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #f0b429',
                    color: '#f0b429',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem'
                  }}>
                    {name}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}