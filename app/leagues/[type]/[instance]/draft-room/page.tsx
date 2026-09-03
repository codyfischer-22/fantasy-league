'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import ConfirmModal from '@/components/ConfirmModal'

type Castaway = { id: number; name: string }
type Pick = { user_id: string; castaway_id: number }

export default function DraftRoomPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const { user, loading } = useAuth()

  const [league, setLeague] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [castaways, setCastaways] = useState<Castaway[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
  const [members, setMembers] = useState<{ user_id: string; display_name: string }[]>([])
  const [picking, setPicking] = useState(false)
  const [handlingMissedPick, setHandlingMissedPick] = useState(false)
  const [now, setNow] = useState(Date.now())
  const previousStatusRef = useRef<string | null>(null)

  const loadDraftState = async () => {
    const { data: leagueData } = await supabase
      .from('leagues')
      .select('*')
      .eq('league_type', type)
      .eq('slug', instance)
      .single()

    setLeague(leagueData)

    if (leagueData) {
      const { data: castawayList } = await supabase
        .from('castaways')
        .select('id, name')
        .eq('league_type', leagueData.league_type)

      setCastaways(castawayList ?? [])

      const { data: pickList } = await supabase
        .from('draft_picks')
        .select('user_id, castaway_id')
        .eq('league_id', leagueData.id)

      setPicks(pickList ?? [])

      const { data: memberRows } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', leagueData.id)

      if (memberRows && memberRows.length > 0) {
        const memberIds = memberRows.map((m) => m.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', memberIds)

        setMembers(
          (profiles ?? []).map((p) => ({
            user_id: p.user_id,
            display_name: p.display_name || 'Unnamed Player',
          }))
        )
      }
    }

    setPageLoading(false)
  }

  // ---- Derived values (safe against league still being null) ----
  const draftOrder: string[] = league?.draft_order ?? []
  const currentPickIndex = (league?.current_pick_number ?? 1) - 1
  const currentPickerId = draftOrder[currentPickIndex]
  const currentPicker = members.find((m) => m.user_id === currentPickerId)
  const isMyTurn = user?.id === currentPickerId

  const deadlineMs = league?.pick_deadline ? new Date(league.pick_deadline).getTime() : null
  const isExpired = deadlineMs !== null && now >= deadlineMs
  const secondsRemaining = deadlineMs !== null ? Math.max(0, Math.ceil((deadlineMs - now) / 1000)) : null
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const currentRound = league ? Math.ceil(league.current_pick_number / members.length) : 1
  const totalPicksNeeded = members.length * 4
  const baseClone = castaways.length > 0 ? Math.ceil(totalPicksNeeded / castaways.length) : 1
  const [showInstructions, setShowInstructions] = useState(true)
  const [pendingPick, setPendingPick] = useState<{ id: number; name: string } | null>(null)
  const firedWarningsRef = useRef<Set<number>>(new Set())
  const lastPickNumberRef = useRef<number | null>(null)

  const remainingByCastaway: Record<number, number> = {}
  castaways.forEach((c) => {
    remainingByCastaway[c.id] = baseClone
  })
  picks.forEach((p) => {
    if (remainingByCastaway[p.castaway_id] !== undefined) {
      remainingByCastaway[p.castaway_id] -= 1
    }
  })

  const currentPickerAlreadyHas = new Set(
    picks.filter((p) => p.user_id === currentPickerId).map((p) => p.castaway_id)
  )

  const pickedCastawayIds = new Set(picks.map((p) => p.castaway_id))
  const allCastawaysCoveredOnce = castaways.every((c) => pickedCastawayIds.has(c.id))
  const requiresFullCoverage = league?.guarantee_full_coverage && !allCastawaysCoveredOnce

    const isPickable = (castawayId: number) => {
    const hasSlotsLeft = remainingByCastaway[castawayId] > 0
    const notAlreadyOwned = !currentPickerAlreadyHas.has(castawayId)
    if (!hasSlotsLeft || !notAlreadyOwned) return false

    if (requiresFullCoverage) {
      return !pickedCastawayIds.has(castawayId)
    }

    return true
  }

  const rosterByPlayer: Record<string, string[]> = {}
  members.forEach((m) => (rosterByPlayer[m.user_id] = []))
  picks.forEach((p) => {
    const castawayName = castaways.find((c) => c.id === p.castaway_id)?.name ?? 'Unknown'
    if (rosterByPlayer[p.user_id]) {
      rosterByPlayer[p.user_id].push(castawayName)
    }
  })

  // ---- Actions ----
  const handleMakePick = async (castawayId: number, castawayName: string) => {
    if (!user || !league || !isMyTurn) return
    const currentRound = Math.ceil(league.current_pick_number / members.length)
    setPicking(true)

   const { error } = await supabase.from('draft_picks').insert({
  league_id: league.id,
  user_id: user.id,
  castaway_id: castawayId,
  round: currentRound,
  pick_number: league.current_pick_number,
  original_user_id: user.id,
})

    if (error) {
      alert('Something went wrong making your pick. Please try again.')
      setPicking(false)
      return
    }

   const nextPickNumber = league.current_pick_number + 1
const isDraftComplete = nextPickNumber > draftOrder.length
const pickTimerMs = league.pick_timer_seconds ? league.pick_timer_seconds * 1000 : null
const nextDeadline = pickTimerMs && !isDraftComplete
  ? new Date(Date.now() + pickTimerMs).toISOString()
  : null
const { error: advanceError } = await supabase
  .from('leagues')
  .update({
    current_pick_number: nextPickNumber,
    pick_deadline: nextDeadline,
    draft_status: isDraftComplete ? 'completed' : 'in_progress',
  })
  .eq('id', league.id)
if (advanceError) {
  console.log('Failed to advance draft:', advanceError)
}

if (isDraftComplete) {
  await supabase.from('notifications').insert(
    members.map((m) => ({
      user_id: m.user_id,
      message: `The draft for ${league.name} is complete. Check out your roster, make trade offers, and get ready for the season!`,
      link: `/leagues/${type}/${instance}`,
    }))
  )
}

setPicking(false)
await loadDraftState()
}

const handleMissedPick = async () => {
  if (!league) return
  const missedUserId = currentPickerId
  const configuredBehavior = league.missed_pick_behavior || 'bump_to_back'

  let behavior = configuredBehavior
  if (configuredBehavior === 'bump_to_back') {
    const { count: priorBumps } = await supabase
      .from('draft_events')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id)
      .eq('user_id', missedUserId)
      .eq('event_type', 'bumped_to_back')

    if (priorBumps && priorBumps >= 4) {
      behavior = 'random_select'
    }
  }

  if (behavior === 'random_select') {
      const eligibleCastaways = castaways.filter(
        (c) => remainingByCastaway[c.id] > 0 && !currentPickerAlreadyHas.has(c.id)
      )

      if (eligibleCastaways.length === 0) {
        setHandlingMissedPick(false)
        return
      }

      const randomPick = eligibleCastaways[Math.floor(Math.random() * eligibleCastaways.length)]

await supabase.from('draft_picks').insert({
  league_id: league.id,
  user_id: missedUserId,
  castaway_id: randomPick.id,
  round: Math.ceil(league.current_pick_number / members.length),
  pick_number: league.current_pick_number,
  was_auto_assigned: true,
  original_user_id: missedUserId,
})

      const nextPickNumber = league.current_pick_number + 1
      const isDraftComplete = nextPickNumber > draftOrder.length
      const pickTimerMs = league.pick_timer_seconds ? league.pick_timer_seconds * 1000 : null
      const nextDeadline = pickTimerMs && !isDraftComplete
        ? new Date(Date.now() + pickTimerMs).toISOString()
        : null

      await supabase
  .from('leagues')
  .update({
    current_pick_number: nextPickNumber,
    pick_deadline: nextDeadline,
    draft_status: isDraftComplete ? 'completed' : 'in_progress',
  })
  .eq('id', league.id)

await supabase.from('notifications').insert({
  user_id: missedUserId,
  message: `You failed to draft a player before the timer went off in ${league.name}. Per the host-selected policy, the system randomly selected ${randomPick.name} for you.`,
  link: `/leagues/${type}/${instance}/draft-room`,
})

if (isDraftComplete) {
  await supabase.from('notifications').insert(
    members.map((m) => ({
      user_id: m.user_id,
      message: `The draft for ${league.name} is complete. Check out your roster, make trade offers, and get ready for the season!`,
    }))
  )
}
    } else {
  const newOrder = [...draftOrder]
  newOrder.splice(currentPickIndex, 1)
  newOrder.push(missedUserId)
  const pickTimerMs = league.pick_timer_seconds ? league.pick_timer_seconds * 1000 : null
  const nextDeadline = pickTimerMs ? new Date(Date.now() + pickTimerMs).toISOString() : null
  await supabase
    .from('leagues')
    .update({
      draft_order: newOrder,
      pick_deadline: nextDeadline,
    })
    .eq('id', league.id)
  await supabase.from('draft_events').insert({
    league_id: league.id,
    user_id: missedUserId,
    event_type: 'bumped_to_back',
    pick_number: league.current_pick_number,
  })
  await supabase.from('notifications').insert({
    user_id: missedUserId,
    message: `You failed to draft a player before the timer went off in ${league.name}. Per the host-selected policy, this pick has been moved to the end of the draft.`,
    link: `/leagues/${type}/${instance}/draft-room`,
  })
}

    setHandlingMissedPick(false)
    await loadDraftState()
  }

  // ---- Effects (all unconditional, always run in the same order) ----
  useEffect(() => {
    if (!loading) {
      loadDraftState()
    }
  }, [type, instance, loading])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
  const pollInterval = setInterval(() => {
    loadDraftState()
  }, 5000)
  return () => clearInterval(pollInterval)
}, [])

useEffect(() => {
  if (
    isExpired &&
    !handlingMissedPick &&
    league?.draft_status === 'in_progress' &&
    members.length > 0
  ) {
    setHandlingMissedPick(true)
    handleMissedPick()
  }
}, [isExpired, members.length])

useEffect(() => {
  const prevStatus = previousStatusRef.current
  const currentStatus = league?.draft_status

  if (currentStatus === 'completed') {
    if (prevStatus === 'in_progress') {
      setShowCompleteModal(true)
    } else if (prevStatus === null) {
      window.location.href = `/leagues/${type}/${instance}`
    }
  }

  previousStatusRef.current = currentStatus ?? null
}, [league?.draft_status])

useEffect(() => {
  if (!league || secondsRemaining === null || !isMyTurn) return

  if (lastPickNumberRef.current !== league.current_pick_number) {
    firedWarningsRef.current = new Set()
    lastPickNumberRef.current = league.current_pick_number
  }

 const thresholds = [600, 300, 60]
const labels: Record<number, string> = {
  600: '10 minutes',
  300: '5 minutes',
  60: '1 minute',
}

  thresholds.forEach((threshold) => {
    if (
      secondsRemaining <= threshold &&
      secondsRemaining > threshold - 5 &&
      !firedWarningsRef.current.has(threshold) &&
      league.pick_timer_seconds &&
      league.pick_timer_seconds > threshold
    ) {
firedWarningsRef.current.add(threshold)
supabase.from('notifications').insert({
  user_id: user?.id,
  message: `⏱️ ${labels[threshold]} left to make your pick in ${league.name}!`,
  link: `/leagues/${type}/${instance}/draft-room`,
})
    }
  })
}, [secondsRemaining, isMyTurn, league?.current_pick_number])

// ---- Early-return renders ----
if (loading || pageLoading) {
  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '30px 16px' }}>
      Loading...
    </main>
  )
}

if (!league) {
  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href={`/leagues/${type}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to League
        </a>
        <p style={{ color: '#555570' }}>Sorry, that league doesn&apos;t exist.</p>
      </div>
    </main>
  )
}

if (league.draft_status !== 'in_progress' && league.draft_status !== 'completed') {
  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href={`/leagues/${type}/${instance}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to {league.name}
        </a>
      <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '4px' }}>
  <span style={{ color: '#f0b429' }}>📋League </span>{' '}
  <span style={{ color: '#ffffff' }}>Draft Room</span>
</h1>
<p style={{ color: '#555570' }}>
  The draft room is not open yet. Please check back once host starts the draft! Full draft policies may be found{' '}
  <a href={`/leagues/${type}/draft`} style={{ color: '#f0b429', textDecoration: 'underline' }}>
    here
  </a>.
</p>
</div>
    </main>
  )
}

if (
  league.draft_status === 'completed' &&
  !showCompleteModal &&
  previousStatusRef.current !== 'in_progress'
) {
  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '30px 16px' }}>
      Redirecting...
    </main>
  )
}

  if (!league) {
    return (
<main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '30px 16px' }}>        <p>Sorry, that league doesn&apos;t exist.</p>
      </main>
    )
  }

  // ---- Main render ----
  return (
<main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '30px 16px' }}>      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <a href={`/leagues/${type}/${instance}`} style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Back to {league.name}
        </a>

        <h1 style={{ color: '#f0b429', fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '12px' }}>
          📋 <span style={{ color: '#f0b429' }}>League</span>{' '}
          <span style={{ color: '#ffffff' }}>Draft Room</span>
        </h1>
{showInstructions && (
  <>
    <p style={{ color: '#a0a0b0', fontSize: '1rem', lineHeight: '1.6', marginBottom: '8px', maxWidth: '800px' }}>
      Welcome to the draft (some call this casting or silly season)! <span style={{ color: '#f0b429' }}>Please note we recommend a computer screen for the optimal drafting experience.</span> A few reminders to get you started:
    </p>
    <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginLeft: '30px', lineHeight: '1.6', marginBottom: '8px', maxWidth: '800px' }}>
      ➤ There are 21 castaways in Survivor 51 so any league with over 5 players will have castways &quot;cloned&quot; as necessary (e.g. 10 players → 40 castaways needed → clone each castaway twice for 42 selectable options).
    </p>
    <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginLeft: '30px', lineHeight: '1.6', marginBottom: '8px', maxWidth: '800px' }}>
      ➤ League hosts determine whether or not all 21 castaways need to be chosen before clones open up. Regardless, no player may recruit the same castaway twice.
    </p>
    <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginLeft: '30px', lineHeight: '1.6', marginBottom: '8px', maxWidth: '800px' }}>
      ➤ Hosts are responsible for setting selection times, deciding what happens if timer goes off (system randomly assigns or turn bumped to end of draft), and assigning draft order (randomly generated or manually-set).
    </p>
    <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '16px', maxWidth: '800px' }}>
      When it&apos;s your turn, click any non-faded castaway to add them to your roster. Once confirmed, selections cannot be changed outside of trade portal. <strong>Let&apos;s get it on!</strong>
    </p>
  </>
)}

<button
  onClick={() => setShowInstructions(!showInstructions)}
  style={{
    background: 'none',
    border: 'none',
    color: '#33334c',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '16px',
    fontFamily: 'inherit',
    textDecoration: 'underline'
  }}
>
  {showInstructions ? 'Hide Welcome ▲' : 'Show Welcome ▼'}
</button>

        {league.draft_status === 'in_progress' && (
          <p style={{ color: isMyTurn ? '#068e38' : '#f0b429', fontSize: 'clamp(.9rem, 6vw, 1.6rem)', fontWeight: isMyTurn ? 'bold' : 'normal', marginBottom: '24px' }}>
            {isMyTurn ? "You're up to draft for" : `${currentPicker?.display_name ?? 'the next Player'} is up to draft for`}
            {' '}pick {league.current_pick_number} of {draftOrder.length}:
          </p>
        )}

        {secondsRemaining !== null && league.draft_status === 'in_progress' && (
          <p style={{ color: secondsRemaining <= 60 ? '#ff6b6b' : '#a0a0b0', fontSize: '1.2rem', marginBottom: '30px' }}>
            ⏱️ {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')} Remaining
          </p>
        )}

<div className="draft-room-columns">
    <div style={{ flex: '0 0 250px' }}>
              <h2 style={{ color: '#f0b429', fontSize: 'clamp(.8rem, 5.5vw, 1.3rem)', marginBottom: '8px' }}>Available Picks</h2>
              <div style={{
                maxHeight: '650px',
                overflowY: 'auto',
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '10px',
                padding: '8px'
              }}>
                {castaways.map((c) => {
                  const pickable = isPickable(c.id) && isMyTurn && !picking
                  const depleted = remainingByCastaway[c.id] <= 0
                  return (
                    <button
                      key={c.id}
                      disabled={!pickable}
                      onClick={() => setPendingPick({ id: c.id, name: c.name })}                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #2a2a3e',
                        color: depleted ? '#3a3a4a' : pickable ? '#ffffff' : '#555570',
                        opacity: depleted ? 0.6 : 1,
                        padding: '10px 14px',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        cursor: pickable ? 'pointer' : 'not-allowed',
                        transition: 'opacity 0.25s ease, background-color 0.2 ease'
                      }}
                      onMouseEnter={(e) => {
                        if (pickable) e.currentTarget.style.backgroundColor = '#12121a'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>


 <div style={{ flex: '0 0 260px' }}>
  <h2 style={{ color: '#f0b429', fontSize: 'clamp(.8rem, 5.5vw, 1.3rem)', marginBottom: '8px' }}>Draft Order</h2>
  <div style={{
    maxHeight: '650px',
    overflowY: 'auto',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '10px',
    padding: '8px'
  }}>
    {draftOrder.map((userId, index) => {
      const isDone = index < currentPickIndex
      const isCurrent = index === currentPickIndex
      const playerName = members.find((m) => m.user_id === userId)?.display_name ?? 'Unknown'
      return (
        <div
          key={`${userId}-${index}`}
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #2a2a3e',
            color: isDone ? '#3a3a4a' : isCurrent ? '#f0b429' : '#ffffff',
            opacity: isDone ? 0.6 : 1,
            fontWeight: isCurrent ? 'bold' : 'normal',
            fontSize: '0.9rem'
          }}
        >
          {index + 1}) {playerName}
        </div>
      )
    })}
  </div>
</div>

<div style={{ flex: '1 1 250px', minWidth: 0 }}>
  <h2 style={{ color: '#f0b429', fontSize: 'clamp(.8rem, 5.5vw, 1.3rem)', marginBottom: '8px' }}>Live Rosters</h2>
  <div style={{
    maxHeight: '750px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '4px'
  }}>
    {members.map((m) => (
      <div key={m.user_id} style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '14px 18px', flexShrink: 0 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{m.display_name}</div>
        <div style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
          {rosterByPlayer[m.user_id]?.length > 0 ? rosterByPlayer[m.user_id].join(', ') : 'No Picks Yet'}
        </div>
      </div>
    ))}
  </div>
</div>

</div>

{showCompleteModal && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  }}>
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #f0b429',
      borderRadius: '12px',
      padding: '36px',
      maxWidth: '400px',
      textAlign: 'center'
    }}>
      <h2 style={{ color: '#f0b429', fontSize: '1.6rem', marginBottom: '12px' }}>
         🔥 Tribes Are Set
      </h2>
      <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
       The draft is complete. Check out your roster, make trade offers, and get ready for the season!
      </p>
      <button
        onClick={() => (window.location.href = `/leagues/${type}/${instance}`)}
        style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '12px 28px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        Back to League →
      </button>
    </div>
  </div>
)}

<ConfirmModal
  open={pendingPick !== null}
  title="Confirm Your Pick"
  message={`Are you sure you want to select ${pendingPick?.name} for your Round ${currentRound} pick?`}
  confirmText="Confirm Pick"
  onConfirm={() => {
    if (pendingPick) handleMakePick(pendingPick.id, pendingPick.name)
    setPendingPick(null)
  }}
  onCancel={() => setPendingPick(null)}
/>

      </div>
    </main>
  )
}