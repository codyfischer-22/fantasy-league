'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { leagueTypeLabels } from '@/lib/leagueTypeLabels'
import { Calculator } from 'lucide-react'
import { Lock } from 'lucide-react'

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
    group_earns_5k: 'Group Earns $5K',
    team_shield: 'Team Shield',
    personal_shield: 'Personal Shield',
    win_dagger: 'Win Dagger',
    murdered_in_night: 'Murdered in the Night',
    murdered_in_plain_sight: "Murdered in Plain Sight",
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
   'uncharted-turretory-demo': {
    group_earns_5k: 'Group Earns $5K',
    team_shield: 'Team Shield',
    personal_shield: 'Personal Shield',
    win_dagger: 'Win Dagger',
    murdered_in_night: 'Murdered in the Night',
    murdered_in_plain_sight: "Murdered in Plain Sight",
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

const scoringLogIntro: Record<string, string> = {
  'secrets-on-the-beach': 'Check out the fully-transparent points breakdown for Secrets on the Beach! Please note episodes with more than one tribal council (e.g. premiere or finale) may be broken down into multiple entries (e.g. Ep. 4 and Ep. 4.5).',
  'sotb-demo': 'Check out the fully-transparent points breakdown for Secrets on the Beach! Please note episodes with more than one tribal council (e.g. premiere or finale) may be broken down into multiple multiple entries (e.g. Ep. 4 and Ep. 4.5).',
  'uncharted-turretory': 'Check out the fully-transparent points breakdown for Uncharted Turretory! Please note episodes with more than one round table may be broken down into multiple multiple entries (e.g. Ep. 4 and Ep. 4.5).',
  'uncharted-turretory-demo': 'Check out the fully-transparent points breakdown for Uncharted Turretory! Please note episodes with more than one round table may be broken down into multiple multiple entries (e.g. Ep. 4 and Ep. 4.5).',
}

type ScoreEntry = {
  castaway_name: string
  category: string
  points: number
  count: number
  notes: string | null
  is_custom: boolean
}

type EpisodeGroup = {
  episode_number: number
  entries: ScoreEntry[]
}

export default function ScoringLogPage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string
  const searchParams = useSearchParams()
  const fromInstance = searchParams.get('from')
  const [leagueName, setLeagueName] = useState<string | null>(null)
  const [episodes, setEpisodes] = useState<EpisodeGroup[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const [isFrozen, setIsFrozen] = useState(false)
  const categoryLabels = categoryLabelsByLeague[type] ?? {}

useEffect(() => {
async function loadLog() {
  if (type === 'sandbox') {
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

  if (!user && type !== 'sotb-demo') {
    setPageLoading(false)
    return
  }
      if (fromInstance) {
        const { data: league } = await supabase
          .from('leagues')
          .select('name, is_frozen, is_archived')
          .eq('league_type', type)
          .eq('slug', fromInstance)
          .single()

        if (league?.is_archived) {
  router.push('/')
  return
}
        setLeagueName(league?.name ?? null)
        setIsFrozen(league?.is_frozen ?? false)
      }

     let leagueId: number | null = null
if (fromInstance) {
  const { data: leagueRow } = await supabase
    .from('leagues')
    .select('id')
    .eq('league_type', type)
    .eq('slug', fromInstance)
    .single()
  leagueId = leagueRow?.id ?? null
}

const { data: scores } = await supabase
  .from('episode_scores')
  .select('episode_number, castaway_id, category, points, count, notes')
  .eq('league_type', type)
  .order('episode_number', { ascending: false })

const { data: customEntries } = leagueId
  ? await supabase
      .from('custom_scoring_entries')
      .select('episode_number, castaway_id, category_label, points, notes')
      .eq('league_id', leagueId)
      .order('episode_number', { ascending: false })
  : { data: [] }

if ((scores && scores.length > 0) || (customEntries && customEntries.length > 0)) {
  const allCastawayIds = [
    ...new Set([
      ...(scores ?? []).map((s) => s.castaway_id),
      ...(customEntries ?? []).map((c) => c.castaway_id),
    ]),
  ]
  const { data: castawayList } = await supabase
    .from('castaways')
    .select('id, name')
    .in('id', allCastawayIds)
  const nameMap = new Map((castawayList ?? []).map((c) => [c.id, c.name]))

  const grouped: Record<number, ScoreEntry[]> = {}

  ;(scores ?? []).forEach((s) => {
  if (!grouped[s.episode_number]) grouped[s.episode_number] = []
  grouped[s.episode_number].push({
    castaway_name: nameMap.get(s.castaway_id) ?? 'Unknown',
    category: s.category,
    points: s.points,
    count: s.count,
    notes: s.notes,
    is_custom: false,
  })
})

;(customEntries ?? []).forEach((c) => {
  if (!grouped[c.episode_number]) grouped[c.episode_number] = []
  grouped[c.episode_number].push({
    castaway_name: nameMap.get(c.castaway_id) ?? 'Unknown',
    category: c.category_label,
    points: c.points,
    count: 1,
    notes: c.notes,
    is_custom: true,
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

  if (!authLoading && !user && type !== 'sotb-demo') {
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
        <div style={{ display: 'flex', justifyContent: 'center' }}>
  <Lock size={50} strokeWidth={2} color="#a0a0b0" />
</div>
<h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <Calculator size={36} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '0px' }} />
  <span style={{ color: '#f0b429' }}>Episode</span>{' '}
  <span style={{ color: '#ffffff' }}>Scoring Log</span>
</h1>    
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
        <a href={fromInstance ? `/leagues/${type}/${fromInstance}` : '/'} style={{
  color: '#a0a0b0',
  fontSize: '0.85rem',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: '24px'
}}>
{fromInstance ? `← Back to ${leagueName ?? 'League'}` : '← Back to Trekkon Fantasy Leagues'}        </a>

        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <Calculator size={36} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '0px' }} />
  <span style={{ color: '#f0b429' }}>Episode</span>{' '}
  <span style={{ color: '#ffffff' }}>Scoring Log</span>
</h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px' }}>
  {scoringLogIntro[type] ?? `Check out the fully-transparent points breakdown for ${leagueTypeLabels[type] ?? 'this league'}!`}
</p>

        {episodes.length === 0 ? (
          <p style={{ color: '#555570', fontSize: 'clamp(.7rem, 5vw, .85rem)' }}>No episode scores have been submitted yet.</p>
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
                          {castawayTotals[castawayName] > 0 ? '+' : ''}{castawayTotals[castawayName]} Pts.
                        </div>
                      </div>
                     {byCastaway[castawayName].map((entry, idx) => (
  <div key={idx} style={{ color: '#a0a0b0', fontSize: '0.8rem', marginTop: '2px' }}>
    {entry.is_custom && (
      <span style={{ color: '#f0b429', fontWeight: 'bold' }}>🎯 Custom: </span>
    )}
    {categoryLabels[entry.category] ?? entry.category}
{entry.count > 1 ? `\u00A0\u00A0(×${entry.count})` : ''}
    {' | '}
    {entry.points > 0 ? '+' : ''}{entry.points}{entry.count > 1 ? ` Each` : ''}
    {entry.notes ? ` | ${entry.notes}` : ''}
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