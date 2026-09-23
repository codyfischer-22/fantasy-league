'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Lock } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const categoryLabelsByLeague: Record<string, Record<string, string>> = {
  'secrets-on-the-beach': {
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
  },
   'sandbox': {
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
  },
  'sotb-demo': {
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
  },
  'uncharted-turretory': {
    group_earns_5k: 'Group Earns $5,000',
    team_shield: 'Team Shield',
    personal_shield: 'Personal Shield',
    win_dagger: 'Win Dagger',
    murdered_in_night: 'Murdered in the Night',
    murdered_in_plain_sight: 'Murdered in Plain Sight',
    escape_murder_with_shield: 'Escape Murder with Shield',
    first_banished: 'First Castle-Goer Banished',
    banished_round_table: 'Banished at Round Table',
    survive_round_table_cycle: 'Survive Round Table Cycle',
    successful_dagger_play: 'Successful Dagger Play',
    make_fire_of_truth: 'Make Fire of Truth',
    banished_fire_of_truth: 'Banished at Fire of Truth',
    win_quartet: 'Win as a Quartet',
    win_trio: 'Win as a Trio',
    win_duo: 'Win as a Duo',
    win_solo: 'Win the Game Solo',
    manual_adjustment: 'Manual Adjustment',
  },
}

const castawayTermByLeague: Record<string, string> = {
  'secrets-on-the-beach': 'Castaway',
  'sotb-demo': 'Castaway',
  'uncharted-turretory': 'Castle-Goer',
  'uncharted-turretory-demo': 'Castle-Goer',
  'sandbox': 'Contestant',
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
  round: number
  points: number
  expected_points: number
}
type PlayerValue = {
  player_name: string
  total_points: number
  expected_total: number
  efficiency_percent: number
  grade: string
  best_pick: ValuePick | null
}

function gradeForPercent(p: number): string {
  if (p >= 140) return 'A+'
  if (p >= 125) return 'A'
  if (p >= 115) return 'A-'
  if (p >= 108) return 'B+'
  if (p >= 100) return 'B'
  if (p >= 92) return 'B-'
  if (p >= 85) return 'C+'
  if (p >= 75) return 'C'
  if (p >= 65) return 'C-'
  if (p >= 55) return 'D'
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
          {entry.name}: {entry.value} Pts.
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
  const categoryLabels = categoryLabelsByLeague[type] ?? {}
  const castawayTerm = castawayTermByLeague[type] ?? 'Contestant'

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
      const isDemoLeague = type === 'sotb-demo' || type === 'uncharted-turretory-demo'
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
        .select('user_id, castaway_id, round')
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
        const row: CastawayChartRow = { episode: `Ep. ${ep}` }
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
   if (picks && picks.length > 0) {
  const castawayPointsMap = new Map<number, number>()
  scores.forEach((s) => {
    const current = castawayPointsMap.get(s.castaway_id) ?? 0
    castawayPointsMap.set(s.castaway_id, current + s.points * s.count)
  })

  const roundAverages = new Map<number, number>()
  const roundGroups = new Map<number, number[]>()
  picks.forEach((p) => {
    const points = castawayPointsMap.get(p.castaway_id) ?? 0
    const existing = roundGroups.get(p.round) ?? []
    existing.push(points)
    roundGroups.set(p.round, existing)
  })
  roundGroups.forEach((pointsList, round) => {
    const avg = pointsList.reduce((sum, v) => sum + v, 0) / pointsList.length
    roundAverages.set(round, avg)
  })

  const picksByPlayer = new Map<string, ValuePick[]>()
  picks.forEach((p) => {
    const points = castawayPointsMap.get(p.castaway_id) ?? 0
    const castawayName = nameMap.get(p.castaway_id) ?? 'Unknown'
    const expected = roundAverages.get(p.round) ?? 0
    const pick: ValuePick = {
      castaway_name: castawayName,
      round: p.round,
      points,
      expected_points: Math.round(expected * 10) / 10,
    }
    const existing = picksByPlayer.get(p.user_id) ?? []
    existing.push(pick)
    picksByPlayer.set(p.user_id, existing)
  })

  const report: PlayerValue[] = Array.from(picksByPlayer.entries()).map(([uid, picksForPlayer]) => {
    const totalPoints = picksForPlayer.reduce((sum, p) => sum + p.points, 0)
    const expectedTotal = picksForPlayer.reduce((sum, p) => sum + p.expected_points, 0)
    const pct = expectedTotal > 0 ? Math.round((totalPoints / expectedTotal) * 100) : 0
    const bestPick = [...picksForPlayer].sort(
      (a, b) => (b.points - b.expected_points) - (a.points - a.expected_points)
    )[0] ?? null
    return {
      player_name: playerNameMap.get(uid) ?? 'Unnamed Player',
      total_points: totalPoints,
      expected_total: Math.round(expectedTotal * 10) / 10,
      efficiency_percent: pct,
      grade: gradeForPercent(pct),
      best_pick: bestPick,
    }
  })
  report.sort((a, b) => b.efficiency_percent - a.efficiency_percent)
  setValueReport(report)
}
        const castawayOwner = new Map(
  (picks ?? []).map((p) => [p.castaway_id, p.user_id])
)
// Group castaway_ids by owning Player
const castawaysByPlayer = new Map<string, number[]>()
;(picks ?? []).forEach((p) => {
  const existing = castawaysByPlayer.get(p.user_id) ?? []
  existing.push(p.castaway_id)
  castawaysByPlayer.set(p.user_id, existing)
})

// Track each individual castaway's running total (not each Player's)
const castawayRunningTotals: Record<number, number> = {}
castawayIds.forEach((id) => (castawayRunningTotals[id] = 0))

const playerRows: PlayerChartRow[] = []
episodeNumbers.forEach((ep) => {
  const epScores = scores.filter((s) => s.episode_number === ep)
  epScores.forEach((s) => {
    castawayRunningTotals[s.castaway_id] = (castawayRunningTotals[s.castaway_id] ?? 0) + s.points * s.count
  })

  // For each Player, compute their top-3-of-however-many castaways, using totals as of this episode
  const playerTotalsThisEpisode: Record<string, number> = {}
  pNames.forEach((n) => (playerTotalsThisEpisode[n] = 0))

  castawaysByPlayer.forEach((castawayIdsForPlayer, userId) => {
    const playerName = playerNameMap.get(userId)
    if (!playerName) return
    const totals = castawayIdsForPlayer.map((cid) => castawayRunningTotals[cid] ?? 0)
    const top3 = [...totals].sort((a, b) => b - a).slice(0, 3)
    playerTotalsThisEpisode[playerName] = top3.reduce((sum, t) => sum + t, 0)
  })

  const ranked = [...pNames].sort(
    (a, b) => playerTotalsThisEpisode[b] - playerTotalsThisEpisode[a]
  )
  const row: PlayerChartRow = { episode: `Ep. ${ep}` }
  ranked.forEach((name, idx) => {
    row[name] = idx + 1
  })
  playerRows.push(row)
})
setPlayerChartData(playerRows)
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
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <a href={`/leagues/${type}/${instance}`} style={{
          color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px'
        }}>
          ← Back to Previous Page
        </a>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '16px',
          padding: '80px 40px'
        }}>
          <Lock size={50} strokeWidth={2} color="#a0a0b0" />
          <h1 style={{ color: '#f0b429', fontSize: '1.6rem' }}>Analytics is a Castaway+ perk.</h1>
          <p style={{ maxWidth: '400px' }}>
            Upgrade your membership to unlock full-season analytics and track every player and {castawayTerm.toLowerCase()}&apos;s journey week by week.
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
        </div>
      </div>
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
<h1 style={{
  fontSize: 'clamp(1.75rem, 6vw, 2.25rem)',
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px'
}}>
  <TrendingUp size={36} strokeWidth={2} color="#f0b429" style={{ flexShrink: 0, marginTop: '2px' }} />
  <span style={{ flex: 1, minWidth: 0 }}>
    <span style={{ color: '#f0b429' }}>
      League
    </span>{' '}
    <span style={{ color: '#ffffff' }}>Analytics</span>
  </span>
</h1>
<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '36px' }}>
  Paid members get exclusive access to league analytic charts to visual process along the way! Please note episodes with more than one elimination (e.g. tribal council) may be broken down into multiple entries (e.g. Ep. 4 and Ep. 4.5).
</p>

          <>
            <h2 style={{ color: '#f0b429', fontSize: '1.5rem', marginBottom: '4px', textAlign: 'left' }}>
              Draft Value Report
            </h2>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'left' }}>
  Ready to see your report card for Draft School? Your grade compares your roster's total points to the league-wide average for the rounds you drafted in. Can you beat expectations across the board?
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
    (Round {pv.best_pick.round}, {pv.best_pick.points} Pts. vs. {pv.best_pick.expected_points} Avg.)
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
    {' '}(Round {searchedPlayer.best_pick.round}, {searchedPlayer.best_pick.points} Pts. vs. {searchedPlayer.best_pick.expected_points} Avg.)
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
  {castawayTerm} Standings
</h2>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'left' }}>
  Tracking week-to-week {castawayTerm.toLowerCase()} point totals. Search a name to highlight their points journey!
</p>
        <input
          className="search-input-glow"
          type="text"
          placeholder={`Search a ${castawayTerm}...`}
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