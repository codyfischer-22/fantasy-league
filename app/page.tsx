'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Rat, Anchor, Drill, Rocket, HandCoins, Earth, Lock, TestTubeDiagonal, Hammer, CornerLeftUp, Mail, Hourglass, TreePalm, ChessRook, CarFront, Engine, MessageCirclePlus, Crown, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'

type MyLeague = {
  name: string
  type: string
  slug: string
  host_user_id?: string | null
  is_private?: boolean
  draft_status?: string | null
  champion_names?: string[] | null
}

const leagueCircleBackgrounds: Record<string, React.CSSProperties> = {
  'secrets-on-the-beach': {
    backgroundImage: `url('/textures/torches.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  'uncharted-turretory': {
    backgroundImage: `url('/textures/cloaks.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  'sandbox':{
    backgroundImage: `url('/textures/sandbox.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [hostedLeagues, setHostedLeagues] = useState<MyLeague[]>([])
  const [joinedLeagues, setJoinedLeagues] = useState<MyLeague[]>([])
  const [myLeagueTypes, setMyLeagueTypes] = useState<Set<string>>(new Set())
  const [leaguesLoading, setLeaguesLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [userTier, setUserTier] = useState<string | null>(null)
  const [showPrivateLeaguesModal, setShowPrivateLeaguesModal] = useState<string | null>(null)
  const circleRowRef = useRef<HTMLDivElement>(null)
  const tierGridRef = useRef<HTMLDivElement | null>(null)
  const fandomRef = useRef<HTMLDivElement | null>(null)
  const [fandomLoop, setFandomLoop] = useState(false)
  const [circlesOverflow, setCirclesOverflow] = useState(false)
  const [circlesAtStart, setCirclesAtStart] = useState(true)
  const [circlesAtEnd, setCirclesAtEnd] = useState(false)
  const [publicLeaguesByType, setPublicLeaguesByType] = useState<Record<string, { name: string; slug: string }[]>>({})
  const [showPublicLeaguesModal, setShowPublicLeaguesModal] = useState<string | null>(null)
  const [recentSupporters, setRecentSupporters] = useState<{ kind: 'gift' | 'champ'; name: string; detail: string }[]>([])
  const [supporterIdx, setSupporterIdx] = useState(0)

  const relevantLeagues = [...hostedLeagues, ...joinedLeagues].filter(
  (l) => l.type === showPrivateLeaguesModal && l.is_private === true
)

useEffect(() => {
  async function loadUserTier() {
    if (!user) {
      setUserTier(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('tier')
      .eq('user_id', user.id)
      .single()
    setUserTier(data?.tier ?? 'stowaway')
  }
  loadUserTier()
}, [user])

  useEffect(() => {
    async function loadMyLeagues() {
      if (!user) {
        setLeaguesLoading(false)
        return
      }
      const { data: memberRows } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', user.id)

      const leagueIds = (memberRows ?? []).map((m) => m.league_id)
      if (leagueIds.length === 0) {
        setLeaguesLoading(false)
        return
      }

     const { data: leagues } = await supabase
  .from('leagues')
  .select('name, league_type, slug, host_user_id, is_show_chat, is_private, draft_status, champion_names')
    .in('id', leagueIds)
  .eq('is_archived', false)

const realLeagues = (leagues ?? []).filter((l) => !l.is_show_chat && l.league_type !== 'social_game')
      const mapped = realLeagues.map((l) => ({
  name: l.name,
  type: l.league_type,
  slug: l.slug,
  host_user_id: l.host_user_id,
  is_private: l.is_private,
  draft_status: l.draft_status,
  champion_names: l.champion_names,
}))

      setHostedLeagues(mapped.filter((l) => l.host_user_id === user.id))
      setJoinedLeagues(mapped.filter((l) => l.host_user_id !== user.id))
      console.log('Mapped leagues:', mapped)
      setMyLeagueTypes(new Set(mapped.map((l) => l.type)))
      setLeaguesLoading(false)
    }
    if (!loading) {
      loadMyLeagues()
    }
  }, [user, loading])

    useEffect(() => {
    async function loadPublicLeagues() {
      const { data } = await supabase
        .from('leagues')
        .select('name, slug, league_type')
        .eq('is_private', false)
        .eq('is_show_chat', false)
        .eq('is_archived', false)
        .in('league_type', ['secrets-on-the-beach', 'uncharted-turretory'])
        .order('name')
      const grouped: Record<string, { name: string; slug: string }[]> = {}
      ;(data ?? []).forEach((l) => {
        if (!grouped[l.league_type]) grouped[l.league_type] = []
        grouped[l.league_type].push({ name: l.name, slug: l.slug })
      })
      setPublicLeaguesByType(grouped)
    }
    loadPublicLeagues()
  }, [])

  useEffect(() => {
    async function loadBanner() {
      const tierNames: Record<string, string> = { castaway: 'Castaway', crewchief: 'Crew Chief', teamprincipal: 'Team Principal' }

      const { data: tips } = await supabase
        .from('supporters')
        .select('public_name, amount_cents')
        .order('created_at', { ascending: false })
        .limit(10)
      const { data: members } = await supabase.rpc('public_member_supporters')
      const { data: crowned } = await supabase.rpc('crowned_champions')

      const gifts = (tips ?? []).map((t) => ({
        kind: 'gift' as const,
        name: t.public_name,
        detail: `$${(t.amount_cents / 100).toFixed(t.amount_cents % 100 === 0 ? 0 : 2)}`,
      }))
      const subs = (members ?? []).map((m: { display_name: string; tier: string }) => ({
        kind: 'gift' as const,
        name: m.display_name,
        detail: tierNames[m.tier] ?? 'Member',
      }))
      const champs = (crowned ?? []).map((l: { name: string; champion_names: string[] | null }) => ({
        kind: 'champ' as const,
        name: (l.champion_names ?? []).join(' & '),
        detail: l.name.replace(/\p{Extended_Pictographic}\uFE0F?/gu, '').replace(/\s+/g, ' ').trim(),
            }))

      // Rotate through champions, gifts and members in turn
      const mixed: { kind: 'gift' | 'champ'; name: string; detail: string }[] = []
      const lists = [champs, gifts, subs]
      for (let i = 0; i < Math.max(...lists.map((l) => l.length)); i++) {
        lists.forEach((l) => { if (l[i]) mixed.push(l[i]) })
      }
      setRecentSupporters(mixed)
      setSupporterIdx(0)
    }
    loadBanner()
  }, [])

  useEffect(() => {
    if (recentSupporters.length < 2) return
    const t = setInterval(() => setSupporterIdx((i) => (i + 1) % recentSupporters.length), 3500)
    return () => clearInterval(t)
  }, [recentSupporters])

  const openPublicLeagues = (type: string, fallbackSlug: string) => {
    const list = publicLeaguesByType[type] ?? []
    if (list.length > 1) {
      setShowPublicLeaguesModal(type)
    } else {
      router.push(`/leagues/${type}/${list[0]?.slug ?? fallbackSlug}`)
    }
  }

         useEffect(() => {
    const grid = tierGridRef.current
    if (!grid) return
    const update = () => {
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.tier-card'))
      const center = grid.scrollLeft + grid.clientWidth / 2
      let best = 0
      let bestDist = Infinity
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center)
        if (d < bestDist) { bestDist = d; best = i }
      })
      cards.forEach((c, i) => c.classList.toggle('is-active', i === best))
    }
    update()
    grid.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      grid.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  // Mobile: turn on the looping carousel (renders clone cards on each side)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const sync = () => setFandomLoop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const el = fandomRef.current
    if (!el) return
    const getCards = () => Array.from(el.querySelectorAll<HTMLElement>('.fandom-card'))
    const COUNT = 5 // number of real fandom cards

    const activeIdx = () => {
      const cards = getCards()
      const center = el.scrollLeft + el.clientWidth / 2
      let best = 0
      let bestDist = Infinity
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center)
        if (d < bestDist) { bestDist = d; best = i }
      })
      return best
    }

    const update = () => {
      const best = activeIdx()
      getCards().forEach((c, i) => c.classList.toggle('is-active', i === best))
    }

    // Instantly move the scroll position without any visible animation
    const silentMove = (fn: () => void) => {
      const cards = getCards()
      cards.forEach((c) => { c.style.transition = 'none' })
      el.style.scrollSnapType = 'none'
      fn()
      update()
      requestAnimationFrame(() => {
        el.style.scrollSnapType = ''
        requestAnimationFrame(() => { cards.forEach((c) => { c.style.transition = '' }) })
      })
    }

    // Start centered on the first real card (after the left-side clones)
    if (fandomLoop) {
      silentMove(() => {
        const first = getCards()[COUNT]
        if (first) el.scrollLeft = first.offsetLeft + first.offsetWidth / 2 - el.clientWidth / 2
      })
    } else {
      update()
    }

    // When scrolling stops on a clone, jump to the matching real card
    let timer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      update()
      if (!fandomLoop) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        const i = activeIdx()
        const target = i < COUNT ? i + COUNT : i >= COUNT * 2 ? i - COUNT : -1
        if (target === -1) return
        const cards = getCards()
        silentMove(() => { el.scrollLeft += cards[target].offsetLeft - cards[i].offsetLeft })
      }, 120)
    }

        // One card per swipe: we handle sideways swipes ourselves
    let swipeStartX = 0
    let swipeStartY = 0
    const onTouchStart = (e: TouchEvent) => {
      swipeStartX = e.touches[0].clientX
      swipeStartY = e.touches[0].clientY
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!fandomLoop) return
      const dx = e.changedTouches[0].clientX - swipeStartX
      const dy = e.changedTouches[0].clientY - swipeStartY
      if (Math.abs(dx) < 30 || Math.abs(dx) < Math.abs(dy)) return // tap or vertical scroll
      const cards = getCards()
      const i = activeIdx()
      const t = dx < 0 ? Math.min(i + 1, cards.length - 1) : Math.max(i - 1, 0)
      el.scrollTo({ left: cards[t].offsetLeft + cards[t].offsetWidth / 2 - el.clientWidth / 2, behavior: 'smooth' })
    }
    if (fandomLoop) el.style.touchAction = 'pan-y' // phone handles up/down only; we handle sideways
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
      el.style.touchAction = ''
    }
  }, [fandomLoop])

  useEffect(() => {
    const check = () => {
      const el = circleRowRef.current
      if (!el) return
      setCirclesOverflow(el.scrollWidth > el.clientWidth + 4)
      setCirclesAtStart(el.scrollLeft <= 4)
      setCirclesAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [hostedLeagues, joinedLeagues, leaguesLoading])

  const hasRealLeagues = hostedLeagues.length > 0 || joinedLeagues.length > 0
  const showPersonalizedView = !loading && !leaguesLoading && user && hasRealLeagues

  const leagueTypeMeta: Record<string, string> = {
    'secrets-on-the-beach': 'secrets-on-the-beach',
    'uncharted-turretory': 'uncharted-turretory',
  }

  // Fandom cards, as functions so mobile can render looping copies
  // ('main' = the real cards with anchor ids; 'pre'/'post' = clones for the loop)
  const fandomRowA = (copy: string) => (
    <>
            {/* Secrets on the Beach */}
<div
  id={copy === 'main' ? 'secrets-on-the-beach' : undefined}
  className="league-card fandom-card"
  onClick={() => router.push('/leagues/secrets-on-the-beach')}
  style={{
    backgroundImage: `linear-gradient(rgba(26,26,46,.5), rgba(26,26,46,0.5)), url('/textures/sand.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '3px solid #f0b429',
    borderTop: '3px solid #f0b429',
    borderRadius: '12px',
    padding: '28px',
    flex: '0 1 350px',
    cursor: 'pointer'
  }}
>
 <h3 style={{ color: '#f0b429', fontSize: 'clamp(1.2rem, 5.2vw, 1.65rem)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
  <TreePalm size={30} color='#ffffff' strokeWidth={1.5} style={{ flexShrink: 0 }} /> Secrets on the Beach
</h3>
  <p style={{ color: '#ffffff', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
    Set sail for this island adventure, going 25+ years strong, by drafting your tribe, winning challenges, and surviving the vote.
  </p>

  <button
  onClick={(e) => {
    e.stopPropagation()
    openPublicLeagues('secrets-on-the-beach', 'sotb-public')  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#f0b429',
    color: '#0a0a0f',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #0a0a0f',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  <Earth size={18} strokeWidth={2} /> View Public League →
</button>

<button
  onClick={(e) => {
    e.stopPropagation()
    setShowPrivateLeaguesModal('secrets-on-the-beach')
  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: 'rgb(245, 255, 156)',
    color: '#0a0a0f',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #0a0a0f',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  <Lock size={18} strokeWidth={2} /> My Private Leagues →
</button>

<button
  onClick={(e) => {
    e.stopPropagation()
    if (userTier === 'crewchief' || userTier === 'teamprincipal') {
      router.push('/leagues/secrets-on-the-beach/create')
    } else {
      setShowUpgradeModal(true)
    }
  }}
 style={{
  display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    color: '#0a0a0f',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #0a0a0f',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  <Hammer size={18} strokeWidth={2} /> Host Private League →
</button>

<button
  onClick={(e) => {
    e.stopPropagation()
    router.push('/leagues/sotb-demo/sample-league')
  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #a0a0b0',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer'
  }}
>
  <TestTubeDiagonal size={18} strokeWidth={2} /> Explore Demo League →
</button>

</div>

        {/* Uncharted Turretory */}
<div
  id={copy === 'main' ? 'uncharted-turretory' : undefined}
  className="league-card fandom-card"
  onClick={() => router.push('/leagues/uncharted-turretory')}
  style={{
    backgroundImage: `linear-gradient(rgba(26,26,46,.5), rgba(26,26,46,0.75)), url('/textures/traitors.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '3px solid #f0b429',
    borderTop: '3px solid #f0b429',
    borderRadius: '12px',
    padding: '28px',
    flex: '0 1 350px',
    cursor: 'pointer'
  }}
>
   <h3 style={{ color: '#f0b429', fontSize: 'clamp(1.2rem, 5.2vw, 1.65rem)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
  <ChessRook size={30} color='#ffffff' strokeWidth={1.5} style={{ flexShrink: 0 }} /> Uncharted Turretory
</h3>
  <p style={{ color: '#ffffff', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
    Scale the turret steps of Alan's Castle and decide who you'll back in this game of murder, banishment, and deception.
  </p>

  <button
  onClick={(e) => {
    e.stopPropagation()
    openPublicLeagues('uncharted-turretory', 'uncharted-turretory-public')  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#f0b429',
    color: '#0a0a0f',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #0a0a0f',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  <Earth size={16} strokeWidth={2} /> View Public League →
</button>

<button
  onClick={(e) => {
    e.stopPropagation()
    setShowPrivateLeaguesModal('uncharted-turretory')
  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: 'rgb(245, 255, 156)',
    color: '#0a0a0f',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #0a0a0f',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  <Lock size={16} strokeWidth={2} /> My Private Leagues →
</button>

<button
  onClick={(e) => {
    e.stopPropagation()
    if (userTier === 'crewchief' || userTier === 'teamprincipal') {
      router.push('/leagues/uncharted-turretory/create')
    } else {
      setShowUpgradeModal(true)
    }
  }}
  style={{
  display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    color: '#0a0a0f',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #0a0a0f',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  <Hammer size={16} strokeWidth={2} /> Host Private League →
</button>

<button
  onClick={(e) => {
    e.stopPropagation()
    router.push('/leagues/uncharted-turretory-demo/sample-league')
  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #a0a0b0',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer'
  }}
>
  <TestTubeDiagonal size={16} strokeWidth={2} /> Explore Demo League →
</button>
</div>
    </>
  )

  const fandomRowB = (copy: string) => (
    <>
{/* Paddock Politicks */}
<div id={copy === 'main' ? 'paddock-politicks' : undefined} className="fandom-card" style={{
  backgroundImage: `linear-gradient(rgba(26,26,46,.5), rgba(26,26,46,0.75)), url('/textures/paddock.jpg')`,
backgroundSize: 'cover',
backgroundPosition: 'center',
    border: '3px solid #f0b429',
    borderTop: '3px solid #f0b429',
    borderRadius: '12px',
    padding: '28px',
  flex: '0 1 350px'
}}>
<h3 style={{
  color: '#f0b429',
  fontSize: 'clamp(1.5rem, 6vw, 1.7rem)',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}}>
  <Engine size={30} color='#ffffff' strokeWidth={1.5} /> Paddock Politicks
</h3>
  <p style={{ color: '#ffffff', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
    Coming in 2027, travel the globe with world-class drivers up and down the grid over 24 weeks of high octane racing.
  </p>

  <button onClick={() => setShowComingSoon(true)} style={{
  display: 'flex',
  alignItems: 'center', 
  justifyContent: 'center',
   gap: '8px',
  width: '100%', 
  textAlign: 'center',
  backgroundColor: 'transparent',
   color: '#a0a0b0', padding: '10px',
  borderRadius: '6px', border: '1px solid #a0a0b0', fontWeight: 'bold',
  fontSize: '0.9rem', cursor: 'pointer', marginBottom: '10px'
}}>
  <Hourglass size={16} strokeWidth={2} /> On Formation Lap →
</button>
</div>

{/* The Oval Offset */}
<div id={copy === 'main' ? 'the-oval-offset' : undefined} className="fandom-card" style={{
   backgroundImage: `linear-gradient(rgba(26,26,46,.5), rgba(26,26,46,0.75)), url('/textures/oval.jpg')`,
backgroundSize: 'cover',
backgroundPosition: 'center',
    border: '3px solid #f0b429',
    borderTop: '3px solid #f0b429',
    borderRadius: '12px',
    padding: '28px',
  flex: '0 1 350px'
}}>
   <h3 style={{
  color: '#f0b429',
  fontSize: 'clamp(1.4rem, 6vw, 1.7rem)',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
  <CarFront size={30} strokeWidth={1.5} color="#ffffff" /> <span>The Oval Offset</span>
</h3>
  <p style={{ color: '#ffffff', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
    Coming in 2027, climb through the cargo net for 36 weeks of American Thunder and race to the checkered flag.
  </p>

  <button onClick={() => setShowComingSoon(true)} style={{
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  width: '100%', textAlign: 'center',
  backgroundColor: 'transparent', color: '#a0a0b0', padding: '10px',
  borderRadius: '6px', border: '1px solid #a0a0b0', fontWeight: 'bold',
  fontSize: '0.9rem', cursor: 'pointer', marginBottom: '10px'
}}>
  <Hourglass size={16} strokeWidth={2} /> Stuck in Pit Lane →
</button>

</div>

{/* Suggest a New League */}
 <div
  className="league-card fandom-card"
  onClick={() => router.push('/contact')}
  style={{
    backgroundImage: `linear-gradient(rgba(26,26,46,.5), rgba(26,26,46,0.95)), url('/textures/suggest.jpg')`,
backgroundSize: 'cover',
backgroundPosition: 'center',
    border: '3px solid #f0b429',
    borderTop: '3px solid #f0b429',
    borderRadius: '12px',
    padding: '28px',
  flex: '0 1 350px'
  }}
  >
            <h3 style={{ color: '#f0b429', fontSize: 'clamp(1.5rem, 6vw, 1.7rem)', marginBottom: '8px', marginTop: '0px', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <MessageCirclePlus size={30} strokeWidth={1.5} color="#ffffff" /> Suggest a Fandom
</h3>
            <p style={{ color: '#ffffff', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
Got an idea for a league we should build next? Send us your concept and help shape the future of Trekkon Fantasy Leagues. 
</p>
  <button
  onClick={(e) => {
    e.stopPropagation()
    router.push('/contact')
  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#f0b429',
    color: '#0a0a0f',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #0a0a0f',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer'
  }}
>
  <Mail size={16} strokeWidth={2} /> Contact Our Team →
</button>
</div>
    </>
  )

  return (
<main className="trekkon-bg" style={{
  minHeight: '100vh',
  fontFamily: 'Georgia, serif',
  color: '#ffffff'
}}>
  <div className="mobile-home-title" style={{
  display: 'none',
  textAlign: 'center',
  padding: '24px 20px 22px 20px',
  borderBottom: '2px solid #f0b429',
  backgroundColor: '#0a0a0f'
}}>
      <h1 style={{ margin: 0, display: 'flex', justifyContent: 'center' }}>
      <Image
        src="/logo-wide-mobile.png"
        alt="Trekkon Fantasy Leagues"
        width={1278}
        height={192}
        priority
        style={{ width: '90%', maxWidth: '520px', height: 'auto' }}
      />
    </h1>
    <p style={{
      color: '#a0a0b0',
      margin: '4px 0 0 0',
      fontSize: 'clamp(.75rem, 4vw, 0.85rem)',
      marginBottom: '0px',
      letterSpacing: '.9px'
    }}>
      Choose Fandoms. Draft Teams. Beat Buddies.
    </p>
  </div>

  
            {recentSupporters.length > 0 && (() => {
        const s = recentSupporters[supporterIdx % recentSupporters.length]
           const label: React.CSSProperties = {
          fontSize: '0.7rem',
          fontWeight: 'bold',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          lineHeight: 1,
          background: 'linear-gradient(90deg, #f0b429 0%, #f5ff9c 50%, #f0b429 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          animation: 'wallShimmer 3s linear infinite'
        }
        const name: React.CSSProperties = { color: '#ffffff', fontSize: '0.9rem', lineHeight: 1, position: 'relative', top: '.15px' }
                const gold: React.CSSProperties = { color: '#f0b429' }
        return (
          <div>
            <a href="/tip-jar" style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              margin: 0,
              padding: '8px 20px',
              backgroundColor: '#1a1a2e',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid #f0b429',
              borderRadius: 0,
              textDecoration: 'none',
              animation: 'wallGlow 3.5s ease-in-out infinite'
            }}>
                            <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
                <defs>
                  <linearGradient id="bannerShimmer" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="0" spreadMethod="reflect">
                    <stop offset="0" stopColor="#f0b429" />
                    <stop offset="0.5" stopColor="#f5ff9c" />
                    <stop offset="1" stopColor="#f0b429" />
                    <animateTransform attributeName="gradientTransform" type="translate" from="-24 0" to="24 0" dur="3s" repeatCount="indefinite" />
                  </linearGradient>
                </defs>
              </svg>
              {[...Array(6)].map((_, i) => (
                <span key={i} style={{
                  position: 'absolute',
                  left: `${8 + (i * 17) % 84}%`,
                  bottom: '-4px',
                  width: i % 2 === 0 ? '4px' : '3px',
                  height: i % 2 === 0 ? '4px' : '3px',
                  borderRadius: '50%',
                  backgroundColor: i % 2 === 0 ? '#f0b429' : '#f5ff9c',
                  boxShadow: '0 0 6px rgba(240, 180, 41, 0.9)',
                  pointerEvents: 'none',
                  opacity: 0,
                  animation: `tickerFloat ${2.2 + (i % 3) * 0.5}s ease-in-out ${i * 0.4}s infinite`
                }} />
              ))}
              <span key={supporterIdx} style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                animation: 'tickerFade 3.5s ease-in-out'
              }}>
                {s.kind === 'champ' ? (
                  <>
                                           <span className="desktop-only-text">
                      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
                        <Trophy size={18} color="url(#bannerShimmer)" strokeWidth={1.5} style={{ flexShrink: 0, position: 'relative', top: '3px' }} />
                        <span style={label}>Congrats to {s.name}, {s.detail} Champion!</span>
                      </span>
                    </span>
                    <span className="mobile-only-block">
                      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
                        <Trophy size={18} color="url(#bannerShimmer)" strokeWidth={1.5} style={{ flexShrink: 0, position: 'relative', top: '3px' }} />
                        <span style={label}>{s.name} wins {s.detail}!</span>
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                                                                               <span className="desktop-only-text">
                      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
                        <HandCoins size={18} color="url(#bannerShimmer)" strokeWidth={1.5} style={{ flexShrink: 0, position: 'relative', top: '3px' }} />
                        <span style={label}>Your gifts keep these leagues going:</span>
                      </span>
                    </span>
                                                                            <span className="mobile-only-block">
                      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
                        <HandCoins size={18} color="url(#bannerShimmer)" strokeWidth={1.5} style={{ flexShrink: 0, position: 'relative', top: '3px' }} />
                        <span style={label}>Thank you:</span>
                      </span>
                    </span>
                    <span style={name}><strong style={gold}>{s.name}</strong> · {s.detail}</span>
                  </>
                )}
              </span>
            </a>
          </div>
        )
      })()}

      {!showPersonalizedView && (
        <section style={{
          textAlign: 'center',
          padding: '48px 40px',
                  }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 8vw, 3rem)',
            color: '#ffffff',
            marginBottom: '16px',
            letterSpacing: '1px'
          }}>
            Fantasy without the Football, <span style={{ color: '#f0b429' }}>Finally</span>
          </h2>
          <p className="hero-text" style={{
            color: '#a0a0b0',
            fontSize: 'clamp(.85rem, 4.5vw, 1.2rem)',
            maxWidth: '800px',
            margin: '0 auto 16px auto',
            lineHeight: '1.7'
          }}>
            Here comes a new wave of fantasy leagues for the cutthroat, the speed junkies, and the adventurous at heart. <span style={{ fontStyle: 'italic' }}>Trekkon</span> is inspired by the Ancient Greek <span style={{ fontStyle: 'italic' }}>"τρέχω,"</span> to race or run, and <span style={{ fontStyle: 'italic' }}>"ἀγών,"</span> a gathering place for games, competitions, or battles.
          </p>
          <p className="hero-text" style={{
            color: '#a0a0b0',
            fontSize: 'clamp(.85rem, 4.5vw, 1.2rem)',
            maxWidth: '800px',
            margin: '0 auto 0px auto',
            lineHeight: '1.7'
          }}>
This is your arena to compete with friends, family, and on-screen stars on beaches, in castles, and at 200 MPH. Please trust we&apos;ll walk with you to draft teams, make trades, and build community. After the show, get off your couch and live your own adventure!
</p>
        </section>
)}

          

    {showPersonalizedView && (
  <section id="my-leagues" style={{ padding: '48px 40px 24px 40px' }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto', marginTop: '8px' }}>
<div style={{ position: 'relative' }}>
  <div
    ref={circleRowRef}
    className="league-circle-row tool-scroll"
    onScroll={(e) => {
      const el = e.currentTarget
      setCirclesAtStart(el.scrollLeft <= 4)
      setCirclesAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
    }}
    style={{
      overflowX: 'auto',
      overflowY: 'visible',
      scrollbarWidth: 'none',
      padding: '24px 12px',
    }}
  >
    {/* Inner row centers when it fits, scrolls (without clipping the first circle) when it doesn't */}
    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '16px', width: 'max-content', margin: '0 auto' }}>
      {[...hostedLeagues, ...joinedLeagues].map((league) => {
        const isHosted = hostedLeagues.some((h) => h.slug === league.slug && h.type === league.type)
        const isLive = league.draft_status === 'in_progress'
        const isCrowned = !!league.champion_names?.length
        return (
          <a
            key={`${league.type}-${league.slug}`}
            href={`/leagues/${league.type}/${league.slug}`}
            className={`league-circle ${isLive ? 'draft-pulse' : ''}`}
            style={{
              '--circle-color': isHosted ? '#ca29ca' : '#f0b429',
              position: 'relative',
              flexShrink: 0,
              ...(leagueCircleBackgrounds[league.type] ?? {}),
            } as React.CSSProperties}
          >
            {isCrowned && (
              <>
                <span style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #f0b42933 0%, transparent 70%)',
                  pointerEvents: 'none',
                  animation: 'circleGlow 3s ease-in-out infinite'
                }} />
                {[...Array(8)].map((_, i) => (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      top: `${55 + ((i * 23) % 35)}%`,
                      left: `${15 + ((i * 41) % 70)}%`,
                      width: i % 3 === 0 ? '4px' : '3px',
                      height: i % 3 === 0 ? '4px' : '3px',
                      borderRadius: '50%',
                      backgroundColor: i % 3 === 0 ? '#f5ff9c' : '#f0b429',
                      boxShadow: '0 0 6px rgba(240, 180, 41, 0.8)',
                      pointerEvents: 'none',
                      opacity: 0,
                      animation: `circleFloat ${2.5 + (i % 4) * 0.5}s ease-in-out ${(i % 5) * 0.45}s infinite`
                    }}
                  />
                ))}
                <span style={{
                  position: 'absolute',
                  top: '11%',
                  left: '42%',
                  display: 'flex',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}>
                  <Crown size={30} color="#f0b429" strokeWidth={2} />
                </span>
              </>
            )}
            <span className={`league-circle-text ${isLive ? 'draft-room-emoji' : ''}`}>
              {league.name}
            </span>
          </a>
        )
      })}

      {/* Game Lobby: always last */}
      <a
        href="/social-game"
        className="league-circle"
        style={{
          '--circle-color': '#068e38',
          position: 'relative',
          flexShrink: 0,
          backgroundImage: `url('/images/social-game/backgrounds/game-lobby-background.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } as React.CSSProperties}
      />
    </div>
  </div>

  {circlesOverflow && !circlesAtStart && (
    <div style={{
      position: 'absolute', top: 0, left: 0, bottom: 0, width: '48px',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
      background: 'linear-gradient(to left, transparent, rgba(10, 10, 15, 0.9))',
      pointerEvents: 'none', zIndex: 3
    }}>
      <ChevronLeft size={26} color="#f0b429" strokeWidth={2.5} className="draft-room-emoji" />
    </div>
  )}

  {circlesOverflow && !circlesAtEnd && (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: '48px',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      background: 'linear-gradient(to right, transparent, rgba(10, 10, 15, 0.9))',
      pointerEvents: 'none', zIndex: 3
    }}>
      <ChevronRight size={26} color="#f0b429" strokeWidth={2.5} className="draft-room-emoji" />
    </div>
  )}
</div>
  <p style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: '#555570',
    fontSize: 'clamp(0.85rem, 3.5vw, 1rem)',
    textAlign: 'center',
    marginTop: '4px',
    marginBottom: '0px'
  }}>
   <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center',
      position: 'relative',
      top: '-4px' // Adjust (-Npx moves UP, +Npx moves DOWN)
    }}>
      <CornerLeftUp size={16} />
    </span>
    Hot Route to Active Leagues & Game Lobby
  </p> 
</div>
  </section>
)}

      {/* ─── LEAGUES ─── */}
<section id="leagues" className="scroll-offset" style={{ padding: '24px 40px' }}>
  <h2 style={{
    textAlign: 'center',
    color: '#f0b429',
    fontSize: 'clamp(1.75rem, 8vw, 2.25rem)',
    marginBottom: '16px',
    marginTop: '0px',
    letterSpacing: '2px'
  }}> 
  Explore Fandoms
  </h2>

       <div ref={fandomRef} className="fandom-carousel" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="fandom-row" style={{
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '16px',
  marginBottom: '16px'
}}>

            {fandomLoop && <>{fandomRowA('pre')}{fandomRowB('pre')}</>}
            {fandomRowA('main')}

</div>
<div className="fandom-row" style={{
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '16px'
}}>
{fandomRowB('main')}
{fandomLoop && <>{fandomRowA('post')}{fandomRowB('post')}</>}
</div>
</div>

      </section>


{/* ─── PRICING TIERS ─── */}
      <section id="tiers" style={{
        padding: '24px 20px',
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#f0b429',
          fontSize: 'clamp(1.75rem, 8vw, 2.25rem)',
          marginBottom: '-4px',
          marginTop: '0px',
          letterSpacing: '2px'
        }}>
        Membership Tiers
        </h2>
       <p className="mobile-left-text" style={{
  textAlign: 'center',
  color: '#a0a0b0',
  margin: '0 0 24px 0',
  padding: '0 18px',
  fontSize: 'clamp(.85rem, 4.75vw, 1rem)',
}}>
  Prices shown <span style={{ fontWeight: 'bold' }}>per month</span> unless you opt for the yearlong All-Access Pass.
</p>

        <div ref={tierGridRef} className="home-tier-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>

          {/* Stowaway */}
        <div
  className="tier-card"
  onClick={() => router.push('/account?tier=stowaway')}
  style={{
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '12px',
    padding: '28px',
    textAlign: 'center'
  }}
>
           <div style={{ marginBottom: '4px', marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
  <Rat size={40} strokeWidth={2} color="#a0a0b0" />
</div>
<h3 style={{ fontSize: '1.1rem', color: '#a0a0b0', marginBottom: '8px' }}>Stowaway</h3>
            <div style={{ fontSize: '2rem', color: '#a0a0b0', fontWeight: 'bold', marginBottom: '16px' }}>
              $0.00
            </div>
            <ul style={{ color: '#a0a0b0', fontSize: '0.85rem', textAlign: 'left', lineHeight: '2', listStyle: 'none', padding: 0 }}>
              <li>✅ Join 1 Public League</li>
              <li>✅ Private League Access</li>
              <li>✅ Basic Leaderboards</li>
      <li>✅ Trade Portal Access</li>
 <li>❌ No Analytics</li>
              <li>❌ Public League Chat</li>
              <li>❌ No League Hosting</li>
              <li>❌ No Settings Controls</li>
            </ul>
          </div>

          {/* Castaway */}
          <div 
          className="tier-card"
  onClick={() => router.push('/account?tier=castaway')}
  style={{
            backgroundColor: '#1a1a2e',
            border: '2px solid #ffffff',
            borderRadius: '12px',
            padding: '28px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '4px', marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
  <Anchor size={40} strokeWidth={2} color="#ffffff" />
</div>
<h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '8px' }}>Castaway</h3>
            <div style={{ fontSize: '2rem', color: '#ffffff', fontWeight: 'bold', marginBottom: '16px' }}>
              $1.99
            </div>
            <ul style={{ color: '#a0a0b0', fontSize: '0.85rem', textAlign: 'left', lineHeight: '2', listStyle: 'none', padding: 0 }}>
              <li>✅ Multiple Public Leagues</li>
              <li>✅ Private League Access</li>
              <li>✅ Basic Leaderboards</li>
              <li>✅ Trade Portal Access</li>
              <li>✅ Tracking Analytics</li>
              <li>✅ Public League Chat</li>
              <li>❌ No League Hosting</li>
              <li>❌ No Settings Controls</li>
            </ul>
          </div>

          {/* Crew Chief */}
          <div className="tier-card"
  onClick={() => router.push('/account?tier=crewchief')}
          style={{
            backgroundColor: '#1a1a2e',
            border: '2px solid rgb(245, 255, 156)',
            borderRadius: '12px',
            padding: '28px',
            textAlign: 'center'
          }}>
           <div style={{ marginBottom: '4px', marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
  <Drill size={40} strokeWidth={2} color="rgb(245, 255, 156)" />
</div>
<h3 style={{ fontSize: '1.1rem', color: 'rgb(245, 255, 156)', marginBottom: '8px' }}>Crew Chief</h3>
            <div style={{ fontSize: '2rem', color: 'rgb(245, 255, 156)', fontWeight: 'bold', marginBottom: '16px' }}>
              $3.99
            </div>
            <ul style={{ color: '#a0a0b0', fontSize: '0.85rem', textAlign: 'left', lineHeight: '2', listStyle: 'none', padding: 0 }}>
              <li>✅ Multiple Public Leagues</li>
              <li>✅ Private League Access</li>
              <li>✅ Basic Leaderboards</li>
                 <li>✅ Trade Portal Access</li>
                <li>✅ Tracking Analytics</li> 
                <li>✅ Public League Chat</li>
              <li>✅ Host 8-Player League</li>
              <li>✅ Custom League Settings</li>
              
            </ul>
          </div>

          {/* Team Principal */}
          <div 
          className="tier-card"
  onClick={() => router.push('/account?tier=teamprincipal')}
  style={{
            backgroundColor: '#1a1a2e',
            border: '2px solid #e7ab1f',
            borderRadius: '12px',
            padding: '28px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              BEST VALUE
            </div>
<div style={{ marginBottom: '4px', marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
  <Rocket size={40} strokeWidth={2} color="#f0b429" />
</div>
<h3 style={{ fontSize: '1.1rem', color: '#f0b429', marginBottom: '8px' }}>
  Team Principal
</h3>
            <div style={{ fontSize: '2rem', color: '#f0b429', fontWeight: 'bold', marginBottom: '16px' }}>
              $6.99
            </div>
            <ul style={{ color: '#a0a0b0', fontSize: '0.85rem', textAlign: 'left', lineHeight: '2', listStyle: 'none', padding: 0 }}>
           <li>✅ Multiple Public Leagues</li>
              <li>✅ Private League Access</li>
              <li>✅ Basic Leaderboards</li>
                 <li>✅ Trade Portal Access</li>
                 <li>✅ Tracking Analytics</li>
                 <li>⭐ Highlighted in Chat</li>
              <li>⭐ Host 3 18-Player Leagues</li>
              <li>⭐ Custom Scoring Inputs</li>
              
            </ul>
          </div>

        </div>

{/* All-Access Teaser */}
      <div className="all-access-teaser" style={{
  maxWidth: '600px',
  margin: '48px auto 0 auto',
  position: 'relative'
}}>

          {/* Best Value Badge */}
          <div style={{
            position: 'absolute',
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ca29ca',
            color: '#0a0a0f',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            padding: '4px 14px',
            borderRadius: '20px',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            zIndex: 1
          }}>
            TOP-TIER VALUE
          </div>

          {/* Card */}
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '2px dashed #ca29ca',
            borderRadius: '12px',
            padding: '28px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
         <h3 style={{ color: '#ca29ca', fontSize: 'clamp(1.0rem, 8vw, 1.5rem)', marginBottom: '8px' }}>
  <span className="all-access-line1" style={{ color: '#ca29ca', fontWeight: 'bold' }}>Coming in 2027:</span>
  {' '}
  <span className="all-access-line2" style={{ color: '#ffffff', fontWeight: 'bold' }}>All-Access Pass</span>
</h3>
<p style={{ color: '#a0a0b0', fontSize: 'clamp(.7rem, 4.75vw, 1.1rem)', lineHeight: '1.7' }}>
  Annual price for every league, every season, and every perk!
</p>
        </div>   
          <p style={{ color: '#555570', textAlign: 'center', fontSize: '0.9rem', marginBottom: '0px' }}>
  <span className="desktop-only-text">Additional membership perks found in game page below.</span>
  <span className="mobile-only-block">Additional perks found in game page below.</span>
</p>
        </div>

</section>

  
     {/* ─── GAME ─── */}
<section id="get-in-the-game" className="scroll-offset" style={{ padding: '24px 40px' }}>
  <h2 id="play-social-game" style={{
    textAlign: 'center',
    color: '#f0b429',
    fontSize: 'clamp(1.75rem, 8vw, 2.25rem)',
    marginBottom: '12px',
    marginTop: '0px',
    letterSpacing: '2px'
  }}> 
  Get in the Game
  </h2>

  <p className="mobile-left-text" style={{
  color: '#ffffff',
  fontSize: 'clamp(.85rem, 4.5vw, 1rem)',
  maxWidth: '800px',
  textAlign: 'center',
  margin: '0 auto 8px auto',
  lineHeight: '1.7'
}}>
  Watching is fun, but have you ever wondered if you have what it takes to <em>play</em> the game? 
  </p>

<p className="mobile-left-text" style={{ color: '#a0a0b0', fontSize: 'clamp(.85rem, 4.5vw, 1rem)', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
  <em>Trust Issue<span style={{ fontSize: '0.75em', position: 'relative', top: '-0.1em' }}>5</span></em> is an entry-level, social deduction game featuring live voice chats, easy-to-follow game mechanics,{' '}
  <br className="desktop-only-break" />
  and lots of bickering. Five short rounds present infinite possibilities for a new game experience each time!
</p>

<div style={{ maxWidth: '900px', margin: '24px auto' }}>
  <a
    href="/social-game"
    style={{ display: 'block', transition: 'transform 0.2s, box-shadow 0.2s' }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.015)'
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(240, 180, 41, 0.35)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <img
      src="/images/social-game/social-game-screen.png"
      alt="Social deduction game room"
      style={{
        width: '100%',
        borderRadius: '12px',
        border: '2px solid #f0b429',
        display: 'block',
        cursor: 'pointer'
      }}
    />
  </a>
</div>

<p className="mobile-left-text" style={{
  color: '#a0a0b0',
  fontSize: 'clamp(.85rem, 4.5vw, 1rem)',
  maxWidth: '800px',
  textAlign: 'center',
  margin: '0 auto 24px auto'
}}>
  Though we certainly recommend honesty, kindness, and integrity in the real world, <em>Trust Issue<span style={{ fontSize: '0.75em', position: 'relative', top: '-0.1em' }}>5</span></em> is a great place to test your lying, deceiving, and backstabbing accumen.
</p>


  </section>

  

{showUpgradeModal && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  }}>
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #f0b429',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '380px',
      textAlign: 'left'
    }}>
      <h3 style={{ color: '#f0b429', fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '12px' }}>
        Crew Chief+ Required
      </h3>
      <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
        You must be a Crew Chief or Team Principal to host private leagues. Upgrade your membership to start your own league!
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
        <button
          onClick={() => router.push('/account?tier=crewchief')}
          style={{
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Upgrade Now
        </button>
        <button
          onClick={() => setShowUpgradeModal(false)}
          style={{
            backgroundColor: 'transparent',
            color: '#a0a0b0',
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #2a2a3e',
            cursor: 'pointer'
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  </div>
)}

{showPrivateLeaguesModal && (() => {
  const relevantLeagues = [...hostedLeagues, ...joinedLeagues].filter(
    (l) => l.type === showPrivateLeaguesModal && l.is_private === true
  )
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '380px',
        width: '90%',
        textAlign: 'left'
      }}>
        <h3 style={{ color: '#f0b429', fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '16px' }}>
          Your Private Leagues
        </h3>
        {relevantLeagues.length === 0 ? (
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
            You&apos;re not in any private leagues for this fandom.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {relevantLeagues.map((league) => (
              <a
                key={league.slug}
                href={`/leagues/${league.type}/${league.slug}`}
                style={{
                  backgroundColor: '#12121a',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                {league.name} →
              </a>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowPrivateLeaguesModal(null)}
          style={{
            backgroundColor: 'transparent',
            color: '#a0a0b0',
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #2a2a3e',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
})()}

{showPublicLeaguesModal && (
  <div
    onClick={() => setShowPublicLeaguesModal(null)}
    style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
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
        textAlign: 'left'
      }}
    >
      <h3 style={{ color: '#f0b429', fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '16px' }}>
        Public Leagues
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {(publicLeaguesByType[showPublicLeaguesModal] ?? []).map((league) => (
          <a
            key={league.slug}
            href={`/leagues/${showPublicLeaguesModal}/${league.slug}`}
            style={{
              backgroundColor: '#12121a',
              borderRadius: '8px',
              padding: '12px 16px',
              textDecoration: 'none',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            {league.name} →
          </a>
        ))}
      </div>
      <button
        onClick={() => setShowPublicLeaguesModal(null)}
        style={{
          backgroundColor: 'transparent',
          color: '#a0a0b0',
          padding: '10px 20px',
          borderRadius: '6px',
          border: '1px solid #2a2a3e',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Close
      </button>
    </div>
  </div>
)}

{showComingSoon && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  }}>
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #f0b429',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '380px',
      textAlign: 'center'
    }}>
      <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
        We&apos;re sorry! The track is still being paved. Try back soon for our new racing leagues!
      </p>
      <button onClick={() => setShowComingSoon(false)} style={{
        backgroundColor: '#f0b429',
        color: '#0a0a0f',
        padding: '10px 28px',
        borderRadius: '6px',
        border: 'none',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        cursor: 'pointer'
      }}>
        Got it!
      </button>
    </div>
  </div>
)}

<style>{`
  @keyframes circleGlow {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  @keyframes circleFloat {
    0% { transform: translateY(0); opacity: 0; }
    25% { opacity: 0.9; }
    80% { opacity: 0.9; }
    100% { transform: translateY(-50px); opacity: 0; }
  }
  @keyframes wallGlow {
    0%, 100% { box-shadow: 0 0 8px rgba(240, 180, 41, 0.25); }
    50% { box-shadow: 0 0 20px rgba(240, 180, 41, 0.5); }
  }
  @keyframes wallShimmer {
    to { background-position: 200% center; }
  }
  @keyframes tickerFloat {
    0% { transform: translateY(0); opacity: 0; }
    30% { opacity: 0.9; }
    100% { transform: translateY(-30px); opacity: 0; }
  }
  @keyframes tickerFade {
    0% { opacity: 0; transform: translateY(6px); }
    12%, 88% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-6px); }
  }
`}</style>

    </main>
  )
}