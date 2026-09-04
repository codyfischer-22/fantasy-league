'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LogEntry = {
  pick_number: number
  round: number | null
  display_name: string
  castaway_name: string | null
  rank_choice: number | null
  was_auto_assigned: boolean
  event_type: 'pick' | 'bumped_to_back'
}

export default function DraftLogPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const [draftDate, setDraftDate] = useState<string | null>(null)
  const [leagueName, setLeagueName] = useState('')
  const [log, setLog] = useState<LogEntry[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [isPrivateLeague, setIsPrivateLeague] = useState(false)

  useEffect(() => {
    async function loadLog() {
   const { data: league } = await supabase
  .from('leagues')
  .select('id, name, is_private')
  .eq('league_type', type)
  .eq('slug', instance)
  .single()

      if (!league) {
        setPageLoading(false)
        return
      }

      setLeagueName(league.name)
      setIsPrivateLeague(league.is_private ?? false)

const { data: picks } = await supabase
  .from('draft_picks')
  .select('pick_number, round, original_user_id, castaway_id, drafted_at, was_auto_assigned')
  .eq('league_id', league.id)
  .order('pick_number')

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

              const safePicks = picks ?? []
        const safeEvents = events ?? []
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
  pick_number: p.pick_number,
  round: p.round,
  display_name: nameMap.get(p.original_user_id) ?? 'Unnamed Player',
  castaway_name: castawayMap.get(p.castaway_id) ?? 'Unknown Castaway',
  rank_choice: rankMap.get(`${p.original_user_id}-${p.castaway_id}`) ?? null,
  was_auto_assigned: p.was_auto_assigned ?? false,
  event_type: 'pick',
}))

        const eventEntries: LogEntry[] = safeEvents.map((e) => ({
          pick_number: e.pick_number,
          round: null,
          display_name: nameMap.get(e.user_id) ?? 'Unnamed Player',
          castaway_name: null,
          rank_choice: null,
          was_auto_assigned: false,
          event_type: 'bumped_to_back',
        }))

        const entries = [...pickEntries, ...eventEntries].sort((a, b) => a.pick_number - b.pick_number)

        setLog(entries)
      }

      setPageLoading(false)
    }

    loadLog()
  }, [type, instance])

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

        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '4px' }}>
  📋 <span style={{ color: '#f0b429' }}>League</span>{' '}
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
      <div key={entry.pick_number} style={{
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
                {' '}(Round {entry.round}) — <strong>{entry.display_name}</strong> {entry.was_auto_assigned ? 'missed pick & randomly assigned' : 'selected'} {entry.castaway_name}.
              </>
            )}
          </div>
{!entry.was_auto_assigned && !isPrivateLeague && (
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