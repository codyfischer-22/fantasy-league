'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import ResourcesModal from '@/components/ResourcesModal'
import { Search } from 'lucide-react'
import { castawayTermByLeague } from '@/lib/leagueConfig'

type Castaway = {
  id: number
  name: string
  status: string
}

export default function RankingsPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const { user, loading } = useAuth()
  const router = useRouter()

  const [leagueId, setLeagueId] = useState<number | null>(null)
  const [leagueName, setLeagueName] = useState('')
  const [castaways, setCastaways] = useState<Castaway[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [alreadyDrafted, setAlreadyDrafted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showResources, setShowResources] = useState(false)
  const castawayTerm = castawayTermByLeague[type] ?? 'Castaway'
  const [isLiveDraft, setIsLiveDraft] = useState(false)
  const [hasTimer, setHasTimer] = useState(false)
  const [autodraftMode, setAutodraftMode] = useState('end_of_turn')
  const [draftIsLive, setDraftIsLive] = useState(false)
  const [liveNoticeDismissed, setLiveNoticeDismissed] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setPageLoading(false)
        return
      }

      const { data: league } = await supabase
        .from('leagues')
        .select('id, name, league_type, is_archived, draft_mode, pick_timer_seconds, draft_status, season')
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

      const { data: membership } = await supabase
        .from('league_members')
        .select('user_id, autodraft_mode')
        .eq('league_id', league.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership) {
        router.push(`/leagues/${type}/${instance}`)
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
        }}

      const { count: pickCount } = await supabase
        .from('draft_picks')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id)

      const draftDone =
        league.draft_status === 'completed' ||
        (league.draft_status !== 'in_progress' && (pickCount ?? 0) > 0)

      if (draftDone) {        setAlreadyDrafted(true)
        setLeagueId(league.id)
        setLeagueName(league.name)
        setPageLoading(false)
        return
      }

      setLeagueId(league.id)
      setLeagueName(league.name)

      const live = (league.draft_mode ?? 'live') === 'live'
      setDraftIsLive(league.draft_status === 'in_progress')
      const timer = !!league.pick_timer_seconds
      setIsLiveDraft(live)
      setHasTimer(timer)
      const savedMode = membership.autodraft_mode ?? 'end_of_turn'
      setAutodraftMode(!timer && savedMode === 'end_of_turn' ? 'off' : savedMode)

           let castawayQuery = supabase
        .from('castaways')
        .select('id, name, status')
        .eq('league_type', league.league_type)
      castawayQuery = league.season
        ? castawayQuery.eq('season', league.season)
        : castawayQuery.is('season', null)
      const { data: castawayList } = await castawayQuery
        .order('default_rank', { ascending: true, nullsFirst: false })

      const { data: existingRankings } = await supabase
        .from('draft_rankings')
        .select('castaway_id, rank_position')
        .eq('league_id', league.id)
        .eq('user_id', user.id)
        .order('rank_position')

      if (existingRankings && existingRankings.length > 0 && castawayList) {
        const rankedIds = existingRankings.map((r) => r.castaway_id)
        const rankedCastaways = rankedIds
          .map((id) => castawayList.find((c) => c.id === id))
          .filter((c): c is Castaway => !!c)
        const unranked = castawayList.filter((c) => !rankedIds.includes(c.id))
        setCastaways([...rankedCastaways, ...unranked])
      } else {
        setCastaways(castawayList ?? [])
      }

      setPageLoading(false)
    }

    if (!loading) {
      loadData()
    }
  }, [type, instance, user, loading])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const moveUp = (index: number) => {
    if (index === 0) return
    const updated = [...castaways]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    setCastaways(updated)
  }

  const moveDown = (index: number) => {
    if (index === castaways.length - 1) return
    const updated = [...castaways]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    setCastaways(updated)
  }

  const handleDragStart = (index: number) => {
  setDraggedIndex(index)
}
const [touchDraggedIndex, setTouchDraggedIndex] = useState<number | null>(null)
const touchStartY = useRef<number>(0)

const handleDragOver = (e: React.DragEvent, index: number) => {
  e.preventDefault()
  if (draggedIndex === null || draggedIndex === index) return
  const updated = [...castaways]
  const [moved] = updated.splice(draggedIndex, 1)
  updated.splice(index, 0, moved)
  setCastaways(updated)
  setDraggedIndex(index)
}

const handleDragEnd = () => {
  setDraggedIndex(null)
}

const handleTouchStart = (index: number, e: React.TouchEvent) => {
  setTouchDraggedIndex(index)
  touchStartY.current = e.touches[0].clientY
}

const handleTouchMove = (e: React.TouchEvent) => {
  if (touchDraggedIndex === null) return
  e.preventDefault() // stops the page itself from scrolling while dragging
  const touchY = e.touches[0].clientY
  const rowElements = document.querySelectorAll('[data-rank-row]')
  rowElements.forEach((el, index) => {
    const rect = el.getBoundingClientRect()
    if (touchY >= rect.top && touchY <= rect.bottom && index !== touchDraggedIndex) {
      const updated = [...castaways]
      const [moved] = updated.splice(touchDraggedIndex, 1)
      updated.splice(index, 0, moved)
      setCastaways(updated)
      setTouchDraggedIndex(index)
    }
  })
}

const handleTouchEnd = () => {
  setTouchDraggedIndex(null)
}

  const handleSubmit = async () => {
    if (!user || leagueId === null) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase.rpc('save_draft_rankings', {
      p_league_id: leagueId,
      p_castaway_ids: castaways.map((c) => c.id),
    })

       if (!error && isLiveDraft) {
      const { error: modeError } = await supabase.rpc('set_autodraft_mode', {
        p_league_id: leagueId,
        p_mode: autodraftMode,
      })
      setSaving(false)
      setMessage(modeError ? modeError.message : 'Your rankings have been saved!')
      return
    }

    setSaving(false)

    if (error) {
      setMessage(error.message || 'Something went wrong saving your rankings. Please try again.')
    } else {
      setMessage('Your rankings have been saved!')
    }
  }

  if (loading || pageLoading) {
    return <p style={{ color: '#a0a0b0' }}>Loading...</p>
  }

  if (!user) {
    return null
  }

  return (
    <div>

        {alreadyDrafted ? (
                    <div>
            <p style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '20px' }}>
              This league has already drafted, preventing ranking updates. See current rosters and draft results at the links below:
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={`/leagues/${type}/${instance}/leaderboard`} className="btn" style={{
                backgroundColor: '#f0b429',
                color: '#0a0a0f',
                padding: '10px 22px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                View Leaderboard →
              </a>
              <a href={`/leagues/${type}/${instance}/draft-log`} className="btn" style={{
                backgroundColor: 'transparent',
                color: '#f0b429',
                border: '1px solid #f0b429',
                padding: '10px 22px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                View Draft Log →
              </a>
            </div>
          </div>
        ) : (
          <>

        {draftIsLive && !liveNoticeDismissed && (
  <div
    onClick={() => setLiveNoticeDismissed(true)}
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}
  >
   <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '380px',
        width: '90%',
        textAlign: 'center'
      }}
    >
            <h3 className="mobile-left-text" style={{ color: '#f0b429', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '12px' }}>
        Draft Is Currently Live
      </h3>
      <p className="mobile-left-text" style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
        You can still reorder rankings or change auto-draft preferences, applied for next turn!
      </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
          onClick={() => setLiveNoticeDismissed(true)}
          style={{
            backgroundColor: 'transparent',
            color: '#f0b429',
            border: '1px solid #f0b429',
            padding: '10px 24px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  </div>
)}

           <p style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '8px', lineHeight: '1.6' }}>
  Drag and drop your most-wanted {castawayTerm.toLowerCase()} to the top, and work your way down from there. If you need to make a tweak before snake draft begins, just re-edit and save your rankings.
</p>

<p style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.6' }}>
In the event of a live draft, players without saved auto-draft rankings default to host settings (randomly generated or bumped to back).</p> 

{!type.endsWith('-demo') && (
<button
  onClick={() => setShowResources(true)}
  style={{
    backgroundColor: 'transparent',
    color: '#f0b429',
    border: '1px solid #f0b429',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    cursor: 'pointer',
    marginTop: '1rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginLeft: 'auto',
    marginRight: 'auto'
  }}
>
  <Search size={16} strokeWidth={2} /> Research {castawayTerm}s
</button>
)}
<ResourcesModal open={showResources} onClose={() => setShowResources(false)} type={type} />            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
            {castaways.map((castaway, index) => (
 <div
  key={castaway.id}
  data-rank-row
  draggable
  onDragStart={() => handleDragStart(index)}
  onDragOver={(e) => handleDragOver(e, index)}
  onDragEnd={handleDragEnd}
  onTouchStart={(e) => handleTouchStart(index, e)}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
    style={{
      backgroundColor: draggedIndex === index ? '#2a2a3e' : '#1a1a2e',
      border: '1px solid #2a2a3e',
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'grab',
      opacity: draggedIndex === index ? 0.5 : 1,
      touchAction: 'none'
    }}
  >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <span style={{ color: '#555570', fontSize: '1rem', cursor: 'grab' }}>⠿</span>
  <span style={{
    color: '#f0b429',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    minWidth: '24px'
  }}>
    {index + 1}
  </span>
  <span style={{ fontSize: '0.95rem' }}>{castaway.name}</span>
</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #2a2a3e',
                        borderRadius: '6px',
                        color: index === 0 ? '#333' : '#f0b429',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        padding: '4px 10px',
                        fontSize: '0.9rem'
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === castaways.length - 1}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #2a2a3e',
                        borderRadius: '6px',
                        color: index === castaways.length - 1 ? '#333' : '#f0b429',
                        cursor: index === castaways.length - 1 ? 'not-allowed' : 'pointer',
                        padding: '4px 10px',
                        fontSize: '0.9rem'
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>

                        {isLiveDraft && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '10px' }}>
                  Automatically apply to live draft?
                </p>
                {[
                  { value: 'instant', label: 'Auto-draft at the start of my turn.' },
                  ...(hasTimer ? [{ value: 'end_of_turn', label: "Auto-draft to end timer (if no manual pick)." }] : []),
                  { value: 'off', label: "No auto-draft; apply host rules for missed pick." },
                ].map((opt) => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="autodraft"
                      value={opt.value}
                      checked={autodraftMode === opt.value}
                      onChange={() => setAutodraftMode(opt.value)}
                      style={{ marginTop: '4px' }}
                    />
                    <span style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-gold"
              style={{
                backgroundColor: '#f0b429',
                color: '#0a0a0f',
                padding: '14px 32px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save My Rankings'}
            </button>

            {message && (
              <p style={{ color: '#f0b429', fontWeight: 'bold', marginTop: '16px' }}>
                {message}
              </p>
            )}
          </>
        )}

     </div>
  )
}