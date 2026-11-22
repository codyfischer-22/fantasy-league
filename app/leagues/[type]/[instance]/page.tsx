'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { rosterTermByLeague } from '@/lib/leagueConfig'

// YouTube playlist ID per league type (the part after "list=" in the playlist URL).
// Leave a type out (or empty) to hide the video for that league type.
const podcastPlaylistByType: Record<string, string> = {
  'secrets-on-the-beach': 'PLH2t1c28BV7s',
  'sotb-demo': 'PLH2t1c28BV7s',
  'uncharted-turretory': 'PLLQ_n7kjZ1iM',
  'uncharted-turretory-demo': 'PLLQ_n7kjZ1iM',
  'paddock-politicks': '',
  'the-oval-offset': '',
}

const podiumColors = ['#f0b429', '#c0c0c8', '#cd7f32']

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
  const d = new Date(iso)
  return `${months[d.getMonth()]} ${d.getDate()}`
}

type RosterItem = { id: number; name: string; total: number; eliminated: boolean }
type Standing = { user_id: string; display_name: string; total: number; sortedTotals: number[] }
type Activity = { key: string; when: string | null; text: React.ReactNode }

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  border: '1px solid #2a2a3e',
  borderRadius: '10px',
  padding: '18px 20px',
  minWidth: 0,
}

const kickerStyle: React.CSSProperties = {
  color: '#f0b429',
  fontSize: '0.72rem',
  fontWeight: 'bold',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  margin: '0 0 12px 0',
}

const gold = (text: React.ReactNode) => <strong style={{ color: '#f0b429' }}>{text}</strong>

export default function LeagueDashboardPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const basePath = `/leagues/${type}/${instance}`
  const { user, loading: authLoading } = useAuth()

  const rosterTerm = rosterTermByLeague[type] ?? 'Roster'
  const playlistId = podcastPlaylistByType[type] ?? ''

  const [loading, setLoading] = useState(true)
  const [standings, setStandings] = useState<Standing[]>([])
  const [myRoster, setMyRoster] = useState<RosterItem[]>([])
  const [isMember, setIsMember] = useState(false)
  const [hasDrafted, setHasDrafted] = useState(false)
  const [activity, setActivity] = useState<Activity[]>([])
  const [isMobileWidth, setIsMobileWidth] = useState(false)

  useEffect(() => {
    const check = () => setIsMobileWidth(window.innerWidth <= 600)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function load() {
      if (authLoading) return

      const { data: league } = await supabase
        .from('leagues')
        .select('id, league_type')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()
      if (!league) {
        setLoading(false)
        return
      }

      // ---- Members, picks, castaways ----
      const { data: members } = await supabase
        .from('league_members')
        .select('user_id, joined_at')
        .eq('league_id', league.id)
      const memberIds = (members ?? []).map((m) => m.user_id)
      setIsMember(!!user && memberIds.includes(user.id))

      const { data: picks } = await supabase
        .from('draft_picks')
        .select('user_id, castaway_id')
        .eq('league_id', league.id)
      setHasDrafted((picks ?? []).length > 0)

      const { data: trades } = await supabase
        .from('trades')
        .select('id, proposing_user_id, receiving_user_id, offered_castaway_id, requested_castaway_id, is_waiver_move, resolved_at')
        .eq('league_id', league.id)
        .eq('status', 'accepted')
        .order('resolved_at', { ascending: false })
        .limit(6)

      const castawayIds = [...new Set([
        ...(picks ?? []).map((p) => p.castaway_id),
        ...(trades ?? []).flatMap((t) => [t.offered_castaway_id, t.requested_castaway_id]),
      ])]
      const { data: castawayRows } = castawayIds.length > 0
        ? await supabase.from('castaways').select('id, name, status').in('id', castawayIds)
        : { data: [] }
      const castawayById = new Map((castawayRows ?? []).map((c) => [c.id, c]))

      const profileIds = [...new Set([
        ...memberIds,
        ...(trades ?? []).flatMap((t) => [t.proposing_user_id, t.receiving_user_id]).filter((id): id is string => !!id),
      ])]
      const { data: profiles } = profileIds.length > 0
        ? await supabase.from('profiles').select('user_id, display_name').in('user_id', profileIds)
        : { data: [] }
      const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name || 'Unnamed Player']))

      // ---- Points (same math as the Leaderboard) ----
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

      const castawayTotal = new Map<number, number>()
      ;(scores ?? []).forEach((s) => castawayTotal.set(s.castaway_id, (castawayTotal.get(s.castaway_id) ?? 0) + s.points * s.count))
      ;(customEntries ?? []).forEach((c) => castawayTotal.set(c.castaway_id, (castawayTotal.get(c.castaway_id) ?? 0) + c.points))
      const bonusByUser = new Map<string, number>()
      ;(bonusRows ?? []).forEach((b) => bonusByUser.set(b.user_id, (bonusByUser.get(b.user_id) ?? 0) + Number(b.points)))

      const table: Standing[] = memberIds.map((uid) => {
        const totals = (picks ?? [])
          .filter((p) => p.user_id === uid)
          .map((p) => castawayTotal.get(p.castaway_id) ?? 0)
          .sort((a, b) => b - a)
        return {
          user_id: uid,
          display_name: nameById.get(uid) ?? 'Unnamed Player',
          total: totals.slice(0, 3).reduce((sum, t) => sum + t, 0) + (bonusByUser.get(uid) ?? 0),
          sortedTotals: totals,
        }
      })
      table.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        for (let i = 0; i < Math.max(a.sortedTotals.length, b.sortedTotals.length); i++) {
          const diff = (b.sortedTotals[i] ?? 0) - (a.sortedTotals[i] ?? 0)
          if (diff !== 0) return diff
        }
        return 0
      })
      setStandings(table)

      // ---- My roster ----
      const myCastawayIds = user ? (picks ?? []).filter((p) => p.user_id === user.id).map((p) => p.castaway_id) : []
      const roster: RosterItem[] = myCastawayIds
        .map((id) => ({
          id,
          name: castawayById.get(id)?.name ?? 'Unknown',
          total: castawayTotal.get(id) ?? 0,
          eliminated: castawayById.get(id)?.status === 'eliminated',
        }))
        .sort((a, b) => b.total - a.total)
      setMyRoster(roster)

      // ---- Recent activity: accepted trades, waiver swaps, joins ----
      const items: Activity[] = []
      ;(trades ?? []).forEach((t) => {
        const who = nameById.get(t.proposing_user_id) ?? 'A player'
        const offered = castawayById.get(t.offered_castaway_id)?.name ?? 'Unknown'
        const requested = castawayById.get(t.requested_castaway_id)?.name ?? 'Unknown'
        items.push({
          key: `t-${t.id}`,
          when: t.resolved_at,
          text: t.is_waiver_move
            ? <>{who} dropped {gold(offered)} and picked up {gold(requested)}.</>
            : <>{who} traded {gold(offered)} to {nameById.get(t.receiving_user_id ?? '') ?? 'a player'} for {gold(requested)}.</>,
        })
      })
      ;(members ?? []).forEach((m) => {
        items.push({
          key: `j-${m.user_id}`,
          when: m.joined_at,
          text: <>{nameById.get(m.user_id) ?? 'A player'} joined the league.</>,
        })
      })
      items.sort((a, b) => new Date(b.when ?? 0).getTime() - new Date(a.when ?? 0).getTime())
      setActivity(items.slice(0, 6))

      setLoading(false)
    }
    load()
  }, [type, instance, user, authLoading])

  if (loading) {
    return <p style={{ color: '#a0a0b0' }}>Loading...</p>
  }

  const myIndex = user ? standings.findIndex((s) => s.user_id === user.id) : -1
  const me = myIndex >= 0 ? standings[myIndex] : null
  const leader = standings[0]
  const gapToFirst = me && leader ? leader.total - me.total : 0

  return (
        <div style={{
      display: 'grid',
      gridTemplateColumns: isMobileWidth ? '1fr' : '35fr 65fr',
      gap: '16px'
    }}>

      {/* ─── YOUR SEASON (left half) ─── */}
      {isMember && (
              <div style={{ ...cardStyle, padding: '14px 16px' }}>
          <p style={kickerStyle}>Your Season</p>
          {!hasDrafted ? (
            <p style={{ color: '#ffffff', fontSize: '0.95rem', margin: 0 }}>
              Your {rosterTerm.toLowerCase()} is pending the draft.{' '}
              <Link href={`${basePath}/rankings`} style={{ color: '#f0b429', textDecoration: 'underline' }}>
                Set your Pre-Rankings →
              </Link>
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
                <div>
                  <div style={{ color: '#a0a0b0', fontSize: '0.8rem' }}>Rank</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: myIndex < 3 ? podiumColors[myIndex] : '#ffffff' }}>
                    {myIndex + 1} <span style={{ color: '#555570', fontSize: '1rem' }}>of {standings.length}</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: '#a0a0b0', fontSize: '0.8rem' }}>Points</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#f0b429' }}>{me?.total ?? 0}</div>
                </div>
                <div>
                                                    <div style={{ color: '#a0a0b0', fontSize: '0.8rem' }}>
                    {myIndex === 0 ? 'Ahead of 2nd' : 'Behind 1st'}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ffffff' }}>
                    {myIndex === 0
                      ? (standings.length > 1 ? `${leader.total - standings[1].total}` : '—')
                      : gapToFirst}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #2a2a3e', paddingTop: '10px' }}>
                {myRoster.map((c, i) => (
                  <div key={c.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    fontSize: '0.9rem',
                    color: c.eliminated ? '#555570' : '#ffffff',
                    opacity: c.eliminated ? 0.7 : 1
                  }}>
                    <span>
                      {c.name}
                      {c.eliminated && <span style={{ fontSize: '0.75rem', marginLeft: '6px' }}>(Out)</span>}
                      {i === 3 && <span style={{ fontSize: '0.75rem', marginLeft: '6px', color: '#555570' }}>(Bench)</span>}
                    </span>
                    <span style={{ fontWeight: 'bold', color: c.eliminated ? '#555570' : c.total < 0 ? '#ff6b6b' : '#f0b429' }}>
                      {c.total > 0 ? '+' : ''}{c.total}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── PODCAST (right half, stretches to match Your Season) ─── */}
      {playlistId && (
                        <div style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          aspectRatio: '16 / 9',
          alignSelf: 'start',
          ...(!isMember && { gridColumn: '1 / -1' }),
        }}>
          <iframe
            src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
            title="Talkin' with Trekkon"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      )}

      {/* ─── RECENT ACTIVITY (full width below) ─── */}
      {activity.length > 0 && (
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <p style={kickerStyle}>Recent Activity</p>
          {activity.map((a) => (
            <div key={a.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '6px 0', fontSize: '0.85rem', color: '#a0a0b0' }}>
              <span style={{ color: '#ffffff' }}>{a.text}</span>
              <span style={{ flexShrink: 0, color: '#555570' }}>{timeAgo(a.when)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}