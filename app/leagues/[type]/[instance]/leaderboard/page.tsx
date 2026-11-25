'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Trophy } from 'lucide-react'
import { rosterTermByLeague } from '@/lib/leagueConfig'

type CastawayScore = {
  castaway_id: number
  castaway_name: string
  total: number
}
type RaceScore = {
  race_id: number
  round: number
  name: string
  slotPoints: number
  bonusPoints: number
}
type PlayerStanding = {
  user_id: string
  display_name: string
  tier: string
  total: number
  bonusPoints: number
  castaways: CastawayScore[]
  races?: RaceScore[]
}

// Racing leagues (F1 + NASCAR, including demos) score race-by-race, not by episode
const isRacingType = (t: string) => t.startsWith('paddock-politicks') || t.startsWith('the-oval-offset')
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

type DepartedMember = {
  user_id: string
  display_name: string
  castaways: string[]
}

// Gold, silver, bronze for the top 3
const podiumColors = ['#f0b429', '#c0c0c8', '#cd7f32']

export default function LeaderboardPage() {
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const type = params.type as string
  const instance = params.instance as string
  const [standings, setStandings] = useState<PlayerStanding[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [isFrozen, setIsFrozen] = useState(false)
  const [departed, setDeparted] = useState<DepartedMember[]>([])
  const router = useRouter()
  const rosterTerm = rosterTermByLeague[type] ?? 'Roster'
  const isRacing = isRacingType(type)
  const [rosterSize, setRosterSize] = useState(4)

  useEffect(() => {
    async function loadLeaderboard() {
      if (authLoading) return

      const { data: league } = await supabase
        .from('leagues')
        .select('id, name, league_type, is_frozen, is_archived, draft_rounds')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()
      if (!league) {
        setPageLoading(false)
        return
      }
      if (league.is_archived) {
        router.push(`/leagues/${type}`)
        return
      }

      if (league?.league_type === 'sandbox') {
        if (!user) {
          router.push('/')
          return
        }
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('is_global_admin')
          .eq('user_id', user.id)
          .single()
        if (!profileCheck?.is_global_admin) {
          router.push('/')
          return
        }
      }

      setRosterSize(league.draft_rounds ?? 4)
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
        .select('user_id, display_name, tier')
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

      if (isRacingType(league.league_type)) {
        const { data: raceScores } = await supabase
          .from('league_race_scores')
          .select('user_id, race_id, slot_points, bonus_points')
          .eq('league_id', league.id)
        const raceIds = [...new Set((raceScores ?? []).map((s) => s.race_id))]
        const { data: raceRows } = raceIds.length > 0
          ? await supabase.from('races').select('id, round_number, name').in('id', raceIds)
          : { data: [] }
        const raceMap = new Map((raceRows ?? []).map((r) => [r.id, r]))

        const racingStandings: PlayerStanding[] = (profiles ?? []).map((profile) => {
          const myScores = (raceScores ?? []).filter((s) => s.user_id === profile.user_id)
          const races: RaceScore[] = myScores
            .map((s) => ({
              race_id: s.race_id,
              round: raceMap.get(s.race_id)?.round_number ?? 0,
              name: raceMap.get(s.race_id)?.name ?? 'Race',
              slotPoints: Number(s.slot_points),
              bonusPoints: Number(s.bonus_points),
            }))
            .sort((a, b) => b.round - a.round)
          const bonusPoints = races.reduce((sum, r) => sum + r.bonusPoints, 0)
          const total = races.reduce((sum, r) => sum + r.slotPoints + r.bonusPoints, 0)
          return {
            user_id: profile.user_id,
            display_name: profile.display_name || 'Unnamed Player',
            tier: profile.tier ?? 'stowaway',
            total,
            bonusPoints,
            castaways: (picks ?? [])
              .filter((p) => p.user_id === profile.user_id)
              .map((p) => ({ castaway_id: p.castaway_id, castaway_name: castawayNameMap.get(p.castaway_id) ?? 'Unknown', total: 0 })),
            races,
          }
        })
        racingStandings.sort((a, b) => b.total - a.total)
        setStandings(racingStandings)
        setDeparted([])
        setPageLoading(false)
        return
      }
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
          tier: profile.tier ?? 'stowaway',
          total: playerTotal,
          bonusPoints,
          castaways: castawayBreakdown,
        }
      })
      // Ties: compare each roster's castaways from highest-scoring down (1st, 2nd, 3rd, then bench)
      playerStandings.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        const aScores = a.castaways.map((c) => c.total).sort((x, y) => y - x)
        const bScores = b.castaways.map((c) => c.total).sort((x, y) => y - x)
        for (let i = 0; i < Math.max(aScores.length, bScores.length); i++) {
          const diff = (bScores[i] ?? 0) - (aScores[i] ?? 0)
          if (diff !== 0) return diff
        }
        return 0
      })
      setStandings(playerStandings)

      // Departed Players: anyone holding picks in this league who is no longer a member
      const memberIdSet = new Set(userIds)
      const departedIds = [...new Set((picks ?? []).map((p) => p.user_id).filter((id) => !memberIdSet.has(id)))]
      if (departedIds.length > 0) {
        const { data: departedProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', departedIds)
        setDeparted(departedIds.map((uid) => ({
          user_id: uid,
          display_name: (departedProfiles ?? []).find((p) => p.user_id === uid)?.display_name || 'Unnamed Player',
          castaways: (picks ?? [])
            .filter((p) => p.user_id === uid)
            .map((p) => castawayNameMap.get(p.castaway_id))
            .filter((n): n is string => !!n),
        })))
      } else {
        setDeparted([])
      }

      setPageLoading(false)
    }
    loadLeaderboard()
  }, [type, instance, authLoading, user])

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
    return <p style={{ color: '#a0a0b0' }}>Loading...</p>
  }

  // The shared header already shows the red "pit lane" banner for frozen leagues
  if (isFrozen) {
    return (
      <p style={{ color: '#a0a0b0', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
        Standings are paused while this league is frozen.
      </p>
    )
  }

  return (
    <div>
      <h2 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.6rem)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
      </h2>
      <p style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '24px' }}>
        {isRacing
          ? <>Where do you stack up on the leaderboard? Expand a player to see their drivers and race-by-race points. Standings update automatically as race results are scored!</>
          : <>Where do you stack up on the leaderboard? Expand a player to see their {rosterTerm.toLowerCase()} of {rosterSize}. Standings and {rosterTerm.toLowerCase()}s update automatically as episode scores, trades, and waiver wire moves occur!</>}
      </p>

      {standings.length === 0 ? (
        <p style={{ color: '#555570' }}>No players have joined this league yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {standings.map((player, index) => (
            <div key={player.user_id} style={{
              backgroundColor: '#1a1a2e',
              border: index < 3 ? `2px solid ${podiumColors[index]}` : '1px solid #2a2a3e',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, maxWidth: '60%' }}>
                  <span style={{
                    color: index < 3 ? podiumColors[index] : '#555570',
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
                    {player.total > 0 ? '+' : ''}{fmt(player.total)} Pts.
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
                  {isRacing ? (
                    <>
                      <p style={{ color: '#a0a0b0', fontSize: '0.8rem', margin: '12px 0 6px 0' }}>
                        <strong style={{ color: '#ffffff' }}>Drivers:</strong>{' '}
                        {player.castaways.length > 0 ? player.castaways.map((c) => c.castaway_name).join(', ') : 'Pending the draft!'}
                      </p>
                      {(player.races ?? []).length === 0 ? (
                        <p style={{ color: '#555570', fontSize: '0.85rem' }}>No races scored yet.</p>
                      ) : (
                        (player.races ?? []).map((r) => (
                          <div key={r.race_id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            fontSize: '0.85rem',
                            color: '#a0a0b0',
                            borderTop: '1px solid #22223a'
                          }}>
                            <span>R{r.round} · {r.name}</span>
                            <span style={{ color: '#f0b429', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              +{fmt(r.slotPoints + r.bonusPoints)} Pts.
                              {r.bonusPoints > 0 && (
                                <span style={{ color: '#555570', fontWeight: 'normal', fontSize: '0.75rem' }}> (incl. +{fmt(r.bonusPoints)} bonus)</span>
                              )}
                            </span>
                          </div>
                        ))
                      )}
                    </>
                  ) : player.castaways.length === 0 ? (
                    <p style={{ color: '#555570', fontSize: '0.85rem', marginTop: '12px' }}>
                      {rosterTerm}: Pending the draft!
                    </p>
                  ) : (
                    (() => {
                      const sorted = [...player.castaways].sort((a, b) => b.total - a.total)
                      const benchId = sorted[3]?.castaway_id ?? null
                      return sorted.map((c) => {
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

                  {!isRacing && player.bonusPoints > 0 && (
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

      {departed.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ color: '#555570', fontSize: '1.1rem', marginBottom: '16px' }}>
            Departed Players
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {departed.map((member) => (
              <div key={member.user_id} style={{
                backgroundColor: '#12121a',
                border: '1px solid #2a2a3e',
                borderRadius: '10px',
                padding: '16px 20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '1rem', color: '#555570' }}>
                    {member.display_name}
                  </div>
                  <div style={{
                    backgroundColor: '#1a1a2e',
                    color: '#555570',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    Left League
                  </div>
                </div>
                <p style={{ color: '#3a3a44', fontSize: '0.8rem' }}>
                  Released to Free Agents: {member.castaways.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}