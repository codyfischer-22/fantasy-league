'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ClipboardList } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

type LogEntry = {
  pick_number: number
  round: number | null
  display_name: string
  castaway_name: string | null
  rank_choice: number | null
  was_auto_assigned: boolean
  is_free_agent_claim: boolean
  event_type: 'pick' | 'bumped_to_back'
}

const backgroundsByType: Record<string, string> = {
  'secrets-on-the-beach': '/images/social-game/backgrounds/island.jpg',
  'sotb-demo': '/images/social-game/backgrounds/island.jpg',
  'uncharted-turretory': '/images/social-game/backgrounds/traitors.jpg',
  'uncharted-turretory-demo': '/images/social-game/backgrounds/traitors.jpg',
  'paddock-politicks': '/images/social-game/backgrounds/f1.jpg',
  'the-oval-offset': '/images/social-game/backgrounds/nascar.jpg',
}

const castawayTermByLeague: Record<string, string> = {
  'secrets-on-the-beach': 'Castaway',
  'sotb-demo': 'Castaway',
  'uncharted-turretory': 'Castle-Goer',
  'uncharted-turretory-demo': 'Castle-Goer',
  'sandbox': 'Contestant',
}

export default function DraftLogPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const type = params.type as string
  const instance = params.instance as string
  const [draftDate, setDraftDate] = useState<string | null>(null)
  const [leagueName, setLeagueName] = useState('')
  const [log, setLog] = useState<LogEntry[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [isPrivateLeague, setIsPrivateLeague] = useState(false)
  const castawayTerm = castawayTermByLeague[type] ?? 'Contestant'

useEffect(() => {
    async function loadLog() {
      if (authLoading) return
   const { data: league } = await supabase
  .from('leagues')
  .select('id, name, is_private, is_archived, league_type')
  .eq('league_type', type)
  .eq('slug', instance)
  .single()

      if (!league) {
        setPageLoading(false)
        return
      }

      if (league?.is_archived) {
  router.push(`/leagues/${type}`)
  return
}
if (league.league_type === 'sandbox') {
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

      setLeagueName(league.name)
      setIsPrivateLeague(league.is_private ?? false)

const { data: picks } = await supabase
  .from('draft_picks')
  .select('pick_number, round, original_user_id, castaway_id, drafted_at, was_auto_assigned, is_free_agent_claim')
  .eq('league_id', league.id)
  .order('pick_number')

const { data: waiverTrades } = await supabase
  .from('trades')
  .select('proposing_user_id, requested_castaway_id')
  .eq('league_id', league.id)
  .eq('is_waiver_move', true)

const waiverKeys = new Set(
  (waiverTrades ?? []).map((t) => `${t.proposing_user_id}-${t.requested_castaway_id}`)
)

    const { data: events } = await supabase
  .from('draft_events')
  .select('pick_number, user_id, event_type')
  .eq('league_id', league.id)
  .order('pick_number')

       if ((picks && picks.length > 0) || (events && events.length > 0)) {

if (picks && picks.length > 0 && picks[0].drafted_at) {
  setDraftDate(new Date(picks[0].drafted_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }))
}

const safePicks = (picks ?? []).filter(
  (p) => !(p.is_free_agent_claim && waiverKeys.has(`${p.original_user_id}-${p.castaway_id}`))
)        
const safeEvents = events ?? []
const regularMax = Math.max(
  0,
  ...safePicks.filter((p) => !p.is_free_agent_claim).map((p) => p.pick_number)
)
const displayNumberByPick = new Map<number, number>()
safePicks
  .filter((p) => p.is_free_agent_claim)
  .sort((a, b) => a.pick_number - b.pick_number)
  .forEach((p, index) => displayNumberByPick.set(p.pick_number, regularMax + index + 1))
const userIds = [...new Set([...safePicks.map((p) => p.original_user_id), ...safeEvents.map((e) => e.user_id)])]
const castawayIds = [...new Set(safePicks.map((p) => p.castaway_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds)

        const { data: castawayList } = await supabase
          .from('castaways')
          .select('id, name')
          .in('id', castawayIds)

        const { data: rankings } = await supabase
          .from('draft_rankings')
          .select('user_id, castaway_id, rank_position')
          .eq('league_id', league.id)

        const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name || 'Unnamed Player']))
        const castawayMap = new Map((castawayList ?? []).map((c) => [c.id, c.name]))
        const rankMap = new Map(
          (rankings ?? []).map((r) => [`${r.user_id}-${r.castaway_id}`, r.rank_position])
        )

          const pickEntries: LogEntry[] = safePicks.map((p) => ({
pick_number: displayNumberByPick.get(p.pick_number) ?? p.pick_number,  round: p.round,
  display_name: nameMap.get(p.original_user_id) ?? 'Unnamed Player',
  castaway_name: castawayMap.get(p.castaway_id) ?? `Unknown ${castawayTerm}`,
  rank_choice: rankMap.get(`${p.original_user_id}-${p.castaway_id}`) ?? null,
  was_auto_assigned: p.was_auto_assigned ?? false,
  is_free_agent_claim: p.is_free_agent_claim ?? false,
  event_type: 'pick',
}))

       const eventEntries: LogEntry[] = safeEvents.map((e) => ({
  pick_number: e.pick_number,
  round: null,
  display_name: nameMap.get(e.user_id) ?? 'Unnamed Player',
  castaway_name: null,
  rank_choice: null,
  was_auto_assigned: false,
  is_free_agent_claim: false,
  event_type: 'bumped_to_back',
}))

        const entries = [...pickEntries, ...eventEntries].sort((a, b) => a.pick_number - b.pick_number)

        setLog(entries)
      }

      setPageLoading(false)
    }

    loadLog()
  }, [type, instance, user, authLoading])

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

return (
  <main style={{
    backgroundColor: '#0a0a0f',
    minHeight: '100vh',
    fontFamily: 'Georgia, serif',
    color: '#ffffff',
    padding: '60px 40px',
    ...(backgroundsByType[type] && {
      backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.75), rgba(10, 10, 15, 0.85)), url(${backgroundsByType[type]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }),
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
  <ClipboardList size={36} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '0px' }} />
  <span style={{ color: '#f0b429' }}>League</span>{' '}
  <span style={{ color: '#ffffff' }}>Draft Log</span>
</h1>
      <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '32px' }}>
  {draftDate
    ? `Every pick, in order, exactly as the draft ran on ${draftDate}:`
    : 'This league hasn\u2019t drafted yet. Keep an eye peeled for results!'}
</p>

   {log.length > 0 && (
  <div style={{
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '10px',
    overflow: 'hidden'
  }}>
{log.map((entry, i) => (
  <div key={`${entry.pick_number}-${entry.event_type}`} style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
        padding: '14px 20px',
        borderBottom: i < log.length - 1 ? '1px solid #2a2a3e' : 'none'
      }}>
        <div>
         <div style={{ fontSize: '0.95rem' }}>
            <span style={{ color: '#f0b429', fontWeight: 'bold' }}>#{entry.pick_number}</span>
            {entry.event_type === 'bumped_to_back' ? (
              <> — <strong>{entry.display_name}</strong> missed their pick and was bumped to back of the draft.</>
            ) : (
              <>
{entry.is_free_agent_claim ? (
  <> (Late Join) — <strong>{entry.display_name}</strong> claimed {entry.castaway_name}.</>
) : (
  <> (Round {entry.round}) — <strong>{entry.display_name}</strong> {entry.was_auto_assigned ? 'missed pick & randomly assigned' : 'selected'} {entry.castaway_name}.</>
)}              </>
            )}
          </div>
{!entry.was_auto_assigned && !entry.is_free_agent_claim && !isPrivateLeague && (
    <div style={{ color: '#555570', fontSize: '0.8rem', marginTop: '2px' }}>
    {entry.rank_choice
      ? `Their #${entry.rank_choice} ranked choice.`
      : 'Ranking not on record.'}
  </div>
)}
        </div>
      </div>
    ))}
  </div>
)}

      </div>
    </main>
  )
}