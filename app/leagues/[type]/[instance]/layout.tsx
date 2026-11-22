'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import ConfirmModal from '@/components/ConfirmModal'
import { Cog, Palette, Trophy, ChevronDown, Calculator, TrendingUp, Shuffle, Dices, ChevronRight, ChevronLeft, Play, ClipboardList, RefreshCw, Puzzle, Microscope, Lock, ArrowUpDown } from 'lucide-react'
import ResourcesModal from '@/components/ResourcesModal'
import { getFreeAgentPool, type FreeAgent } from '@/lib/freeAgents'
import FreeAgentClaimModal from '@/components/FreeAgentClaimModal'
import { castawayTermByLeague, backgroundsByType } from '@/lib/leagueConfig'
import { runLeagueDraft } from '@/lib/runDraft'
import { emailHostAboutJoin } from '@/lib/emailHostAboutJoin'
import { leagueTypeLabels } from '@/lib/leagueTypeLabels'

type League = {
  id: number
  name: string
  slug: string
  league_type: string
  is_private: boolean
  max_members: number | null
  host_user_id?: string | null
  invite_token?: string | null
  is_frozen?: boolean | null
  draft_status?: string | null
  pick_timer_seconds?: number | null
  draft_order_method?: string | null
  custom_draft_order?: string[] | null
  allow_custom_scoring: boolean
  draft_mode?: string | null
  draft_rounds?: number | null
  champion_names?: string[] | null
  champion_points?: number | null
}

const draftWindowByLeague: Record<string, { name: string; window: string }> = {
  'secrets-on-the-beach': { name: 'Secrets on the Beach', window: 'September 16-20 (7 PM CT)' },
  'uncharted-turretory': { name: 'Uncharted Turretory', window: 'September 16-17 (7 PM CT)' },
}

const pillButton = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  backgroundColor: 'transparent',
  color,
  border: `1px solid ${color}`,
  padding: '6px 14px',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '0.85rem',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
})

const welcomeTextureByType: Record<string, string> = {
  'secrets-on-the-beach': '/textures/torches.jpg',
  'sotb-demo': '/textures/torches.jpg',
  'uncharted-turretory': '/textures/cloaks.jpg',
  'uncharted-turretory-demo': '/textures/cloaks.jpg',
  'paddock-politicks': '/textures/paddock.jpg',
  'the-oval-offset': '/textures/oval.jpg',
  'sandbox': '/textures/sandbox.jpg',
}

const welcomeByLeague: Record<string, { title: string; before: string; after: string }> = {
  'secrets-on-the-beach': {
    title: 'Welcome to the Beach!',
    before: 'Grab your torch and have a seat in',
    after: '!',
  },
  'uncharted-turretory': {
    title: 'Welcome to the Turret!',
    before: 'Watch your back and trust no one in',
    after: '!',
  },
  'paddock-politicks': {
    title: 'Welcome to the Paddock!',
    before: "You've taken your spot on the grid in",
    after: '!',
  },
  'the-oval-offset': {
    title: 'Welcome to the Oval!',
    before: 'Days of thunder await in',
    after: '!',
  },
}
welcomeByLeague['sotb-demo'] = welcomeByLeague['secrets-on-the-beach']
welcomeByLeague['uncharted-turretory-demo'] = welcomeByLeague['uncharted-turretory']

const defaultWelcome = {
  title: 'Welcome to the League!',
  before: "We're excited to have you in",
  after: '!',
}

const tierLabels: Record<string, string> = {
  stowaway: 'Stowaway',
  castaway: 'Castaway',
  crewchief: 'Crew Chief',
  teamprincipal: 'Team Principal',
}

export default function LeagueLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const type = params.type as string
  const instance = params.instance as string
  const basePath = `/leagues/${type}/${instance}`
  const isHome = pathname === basePath
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showStartDraftConfirm, setShowStartDraftConfirm] = useState(false)
  const [hasDrafted, setHasDrafted] = useState(false)
  const [league, setLeague] = useState<League | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [memberTier, setMemberTier] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [myTier, setMyTier] = useState('stowaway')
  const [isHost, setIsHost] = useState(false)
  const [maxMembers, setMaxMembers] = useState<number | null>(null)
  const [hostTier, setHostTier] = useState<string | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showResources, setShowResources] = useState(false)
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const [showFreeAgentModal, setShowFreeAgentModal] = useState(false)
  const [freeAgentPool, setFreeAgentPool] = useState<FreeAgent[]>([])
  const [isMobileWidth, setIsMobileWidth] = useState(false)
  const [startingDraft, setStartingDraft] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [replaceCount, setReplaceCount] = useState<number | null>(null)
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)
  const [toolsAtEnd, setToolsAtEnd] = useState(false)
  const [myLeagues, setMyLeagues] = useState<{ name: string; slug: string }[]>([])
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [toolsAtStart, setToolsAtStart] = useState(true)
  const champRef = useRef<HTMLDivElement>(null)
  const [burstOrigin, setBurstOrigin] = useState<{ x: number; y: number } | null>(null)

  const castawayTerm = castawayTermByLeague[type] ?? 'Contestant'
  const minFreeAgents = ['paddock-politicks', 'the-oval-offset'].includes(type) ? 5 : 3

  useEffect(() => {
    function checkWidth() {
      setIsMobileWidth(window.innerWidth <= 600)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  // Champion fireworks: continuous, launched from the banner
  useEffect(() => {
    if (pageLoading || !league?.champion_names?.length) return
    const updateOrigin = () => {
      const rect = champRef.current?.getBoundingClientRect()
      if (rect) setBurstOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    }
    updateOrigin()
    window.addEventListener('scroll', updateOrigin, { passive: true })
    window.addEventListener('resize', updateOrigin)
    return () => {
      window.removeEventListener('scroll', updateOrigin)
      window.removeEventListener('resize', updateOrigin)
    }
  }, [pageLoading, league?.champion_names?.length])

  useEffect(() => {
    async function loadLeague() {
      const { data: leagueData } = await supabase
        .from('leagues')
        .select('*')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()

      if (leagueData?.is_archived) {
        router.push(`/leagues/${type}`)
        return
      }

      if (leagueData?.league_type === 'sandbox') {
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

      if (user) {
        const { data: adminCheck } = await supabase
          .from('profiles')
          .select('is_global_admin')
          .eq('user_id', user.id)
          .maybeSingle()
        setIsGlobalAdmin(adminCheck?.is_global_admin ?? false)
      }

      setLeague(leagueData)
      if (leagueData && user && leagueData.host_user_id === user.id) {
        setIsHost(true)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('tier')
          .eq('user_id', user.id)
          .single()
        setHostTier(profileData?.tier ?? null)
      }
      if (leagueData) {
        const { count } = await supabase
          .from('league_members')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', leagueData.id)
        setMemberCount(count)
        if (leagueData.is_private && leagueData.host_user_id) {
          const { data: hostProfile } = await supabase
            .from('profiles')
            .select('tier, display_name')
            .eq('user_id', leagueData.host_user_id)
            .single()
          const cap = leagueData.max_members ?? (hostProfile?.tier === 'teamprincipal' ? 18 : 8)
          setMaxMembers(cap)
        }
        const { count: pickCount } = await supabase
          .from('draft_picks')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', leagueData.id)
        const draftHasRun = (pickCount ?? 0) > 0
        setHasDrafted(draftHasRun)

        if (draftHasRun) {
          const pool = await getFreeAgentPool(leagueData.id, leagueData.league_type)
          setFreeAgentPool(pool)
        }
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('tier, display_name')
            .eq('user_id', user.id)
            .single()
          setMyTier(profileData?.tier ?? 'stowaway')
          const { data: memberData } = await supabase
            .from('league_members')
            .select('tier_at_join')
            .eq('league_id', leagueData.id)
            .eq('user_id', user.id)
            .maybeSingle()
          if (memberData) {
            setIsMember(true)
            setMemberTier(profileData?.tier ?? memberData.tier_at_join)
          } else {
            const { count: oldPicks } = await supabase
              .from('draft_picks')
              .select('*', { count: 'exact', head: true })
              .eq('league_id', leagueData.id)
              .eq('user_id', user.id)
            setIsReturning((oldPicks ?? 0) > 0)
          }
        }
      }
            if (user) {
        const { data: myMemberships } = await supabase
          .from('league_members')
          .select('league_id')
          .eq('user_id', user.id)
        const myLeagueIds = (myMemberships ?? []).map((m) => m.league_id)
        if (myLeagueIds.length > 0) {
          const { data: sameType } = await supabase
            .from('leagues')
            .select('name, slug')
            .in('id', myLeagueIds)
            .eq('league_type', type)
            .eq('is_archived', false)
            .order('name')
          setMyLeagues(sameType ?? [])
        }
      }
      setPageLoading(false)
    }
    if (!loading) {
      loadLeague()
    }
  }, [type, instance, user, loading])

  const handleStartDraft = async () => {
    if (startingDraft || !user || !league) return
    setStartingDraft(true)

    const { error, isAuto } = await runLeagueDraft(league)

    if (error) {
      alert(error)
      setStartingDraft(false)
      return
    }

    window.location.href = isAuto ? `${basePath}/leaderboard` : `${basePath}/draft-room`
  }

  const handleClimbAboard = () => {
    if (!user) {
      router.push('/login')
      return
    }
    setShowJoinModal(true)
    if (myTier === 'teamprincipal') {
      confirmJoin()
    }
  }

  const confirmJoin = async () => {
    if (!user || !league) return
    setJoining(true)
    setJoinMessage('')
    const { data: freshLeague } = await supabase
      .from('leagues')
      .select('draft_status')
      .eq('id', league.id)
      .single()
    if (freshLeague?.draft_status === 'in_progress') {
      setJoinMessage('This league is drafting right now. Provided there are unused competitors, registration will reopen once draft is complete.')
      setJoining(false)
      return
    }
    let effectiveCap: number | null = league.max_members
    if (league.is_private && league.host_user_id) {
      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('user_id', league.host_user_id)
        .single()
      effectiveCap = league.max_members ?? (hostProfile?.tier === 'teamprincipal' ? 18 : 8)
    }
    if (effectiveCap) {
      const { count } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id)
      if (count !== null && count >= effectiveCap) {
        setJoinMessage('This league is full. Island hop to find another!')
        setJoining(false)
        return
      }
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, display_name')
      .eq('user_id', user.id)
      .single()
    const currentTier = profile?.tier ?? 'stowaway'
    const { data: memberships } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', user.id)
    const memberLeagueIds = (memberships ?? []).map((m) => m.league_id)
    let publicLeagueCount = 0
    if (memberLeagueIds.length > 0) {
      const { count } = await supabase
        .from('leagues')
        .select('*', { count: 'exact', head: true })
        .in('id', memberLeagueIds)
        .eq('is_private', false)
      publicLeagueCount = count ?? 0
    }
    const maxAllowed = currentTier === 'stowaway' ? 1 : 3
    if (!league.is_private && publicLeagueCount >= maxAllowed) {
      setJoinMessage(
        currentTier === 'stowaway'
          ? 'Stowaways can only join 1 public league. Upgrade to Castaway+ to join up to 3!'
          : "You've reached the max of 3 public leagues for your tier."
      )
      setJoining(false)
      return
    }
    if (isReturning) {
      const { data: rejoin, error: rejoinError } = await supabase.rpc('rejoin_league', { p_league_id: league.id })
      setJoining(false)
      if (rejoinError) {
        setJoinMessage(rejoinError.message)
        return
      }
      await emailHostAboutJoin(league.id, 'rejoin')
      const lost = rejoin?.lost ?? 0
      setIsMember(true)
      setIsReturning(false)
      setMemberCount((prev) => (prev ?? 0) + 1)

      if (lost > 0) {
        // Offer replacements for picks claimed while they were away
        const fullPool = await getFreeAgentPool(league.id, league.league_type)
        const { data: mine } = await supabase
          .from('draft_picks')
          .select('castaway_id')
          .eq('league_id', league.id)
          .eq('user_id', user.id)
        const owned = new Set((mine ?? []).map((p) => p.castaway_id))
        const replacementPool = fullPool.filter((c) => !owned.has(c.id))

        if (replacementPool.length > 0) {
          setShowJoinModal(false)
          setFreeAgentPool(replacementPool)
          setReplaceCount(lost)
          setShowFreeAgentModal(true)
          return
        }
        setJoinMessage(`Welcome back! ${lost} of your players were claimed while you were away, and no free agents are left to replace them.`)
      } else {
        setJoinMessage('Welcome back! Your full roster has been restored.')
      }
      setTimeout(() => window.location.reload(), 2500)
      return
    }

    const { count: pickCount } = await supabase
      .from('draft_picks')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id)

    if (pickCount && pickCount > 0) {
      const pool = await getFreeAgentPool(league.id, league.league_type)
      if (pool.length < minFreeAgents) {
        setJoinMessage('This league has already drafted and no free agent spots remain. Registration is closed.')
        setJoining(false)
        return
      }
      setJoining(false)
      setShowJoinModal(false)
      setFreeAgentPool(pool)
      setReplaceCount(null)
      setShowFreeAgentModal(true)
      return
    }

    const { error } = await supabase.from('league_members').insert({
      user_id: user.id,
      league_id: league.id,
      tier_at_join: profile?.tier ?? 'stowaway',
    })
    setJoining(false)
    if (error) {
      setJoinMessage(error.message)
    } else {
      setShowJoinModal(false)
      setShowWelcomeToast(true)
      setTimeout(() => setShowWelcomeToast(false), 4500)
      setIsMember(true)
      setMemberTier(profile?.tier ?? 'stowaway')
      setMemberCount((prev) => (prev ?? 0) + 1)
      await supabase.from('notifications').insert({
        user_id: user.id,
        message: `You've joined ${league.name}! Check out your league to get started.`,
        link: basePath,
      })
      if (league.is_private && league.host_user_id) {
        await supabase.from('notifications').insert({
          user_id: league.host_user_id,
          message: `${profile?.display_name || 'A new Player'} has joined ${league.name}.`,
          link: basePath,
        })

        const { data: hostProfile } = await supabase
          .from('profiles')
          .select('email, display_name, email_opt_in')
          .eq('user_id', league.host_user_id)
          .single()

        if (hostProfile?.email_opt_in) {
          const { data: { session } } = await supabase.auth.getSession()
          const accessToken = session?.access_token

          await fetch('/api/send-notification-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              recipients: [{
                email: hostProfile.email,
                playerName: hostProfile.display_name || 'Host',
              }],
              subject: `A new player joined ${league.name}!`,
              message: `${profile?.display_name || 'A new Player'} has joined ${league.name}. The competition is on!`,
              linkUrl: `https://trekkonleagues.com${basePath}`,
              linkText: 'View League →',
            }),
          })
        }
      } else if (!league.is_private) {
        const { data: admins } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('is_global_admin', true)
        if (admins && admins.length > 0) {
          await supabase.from('notifications').insert(
            admins.map((a) => ({
              user_id: a.user_id,
              message: `${profile?.display_name || 'A new Player'} has joined ${league.name}.`,
              link: basePath,
            }))
          )
        }
      }
    }
  }

  const handleLeave = async () => {
    if (!user || !league) return
    if (isHost) {
      alert('As the host, use "Scrap League" in your League Settings to remove this league.')
      return
    }
    setLeaving(true)
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single()
    const leavingName = myProfile?.display_name || 'A Player'
    await supabase
      .from('draft_rankings')
      .delete()
      .eq('league_id', league.id)
      .eq('user_id', user.id)
    const { error } = await supabase
      .from('league_members')
      .delete()
      .eq('league_id', league.id)
      .eq('user_id', user.id)
    setLeaving(false)
    if (error) {
      alert('Something went wrong leaving the league. Please try again.')
    } else {
      setIsMember(false)
      setMemberCount((prev) => (prev !== null ? prev - 1 : prev))
      if (league.is_private && league.host_user_id) {
        await supabase.from('notifications').insert({
          user_id: league.host_user_id,
          message: `${leavingName} has left ${league.name}.`,
          link: basePath,
        })

        const { data: hostProfile } = await supabase
          .from('profiles')
          .select('email, display_name, email_opt_in')
          .eq('user_id', league.host_user_id)
          .single()

        if (hostProfile?.email_opt_in) {
          const { data: { session } } = await supabase.auth.getSession()
          const accessToken = session?.access_token

          await fetch('/api/send-notification-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              recipients: [{
                email: hostProfile.email,
                playerName: hostProfile.display_name || 'Host',
              }],
              subject: `A player left ${league.name}..`,
              message: `${leavingName} has left ${league.name}. We just thought we should let you know!`,
              linkUrl: `https://trekkonleagues.com${basePath}`,
              linkText: 'View League →',
            }),
          })
        }
      } else if (!league.is_private) {
        const { data: admins } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('is_global_admin', true)
        if (admins && admins.length > 0) {
          await supabase.from('notifications').insert(
            admins.map((a) => ({
              user_id: a.user_id,
              message: `${leavingName} has left ${league.name}.`,
              link: basePath,
            }))
          )
        }
      }
    }
  }

  useEffect(() => {
    if (!pageLoading && !league) {
      router.push(`/leagues/${type}`)
    }
  }, [pageLoading, league, type, router])

  const mainStyle: React.CSSProperties = {
    backgroundColor: '#0a0a0f',
    minHeight: '100vh',
    fontFamily: 'Georgia, serif',
    color: '#ffffff',
    padding: '60px 40px',
    ...(backgroundsByType[type] && {
      backgroundImage: pathname.endsWith('/analytics')
        ? `linear-gradient(rgba(10, 10, 15, 0.75), rgba(10, 10, 15, 0.85)), url(${backgroundsByType[type]})`
        : `linear-gradient(rgba(10, 10, 15, 0.6), rgba(10, 10, 15, 0.70)), url(${backgroundsByType[type]})`,      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }),
  }

  if (loading || pageLoading) {
    return (
      <main className="mobile-shrink-main" style={mainStyle}>
        Loading...
      </main>
    )
  }

  if (!league) {
    return null
  }

  const toolItems = [
    { label: 'Pre-Rank', icon: ArrowUpDown, href: `${basePath}/rankings` },
    { label: 'Research', icon: Microscope, href: null },
    { label: 'Draft Room', icon: Puzzle, href: `${basePath}/draft-room` },
    { label: 'Leaderboard', icon: Trophy, href: `${basePath}/leaderboard` },
    { label: 'Predictions', icon: Dices, href: `${basePath}/predictions` },
    { label: 'Trade Portal', icon: RefreshCw, href: `${basePath}/trade-portal` },
    { label: 'Scoring Log', icon: Calculator, href: `${basePath}/scoring-log` },
    { label: 'Analytics', icon: TrendingUp, href: `${basePath}/analytics` },
    { label: 'Draft Log', icon: ClipboardList, href: `${basePath}/draft-log` },
  ].filter((item) =>
    !(item.label === 'Pre-Rank' && (type === 'sotb-demo' || type === 'uncharted-turretory-demo')) &&
    !(item.label === 'Draft Room' && (league.draft_mode !== 'live' || league.draft_status === 'completed' || type === 'sotb-demo' || type === 'uncharted-turretory-demo')) &&
    !(item.label === 'Research' && ((hasDrafted && league.draft_status !== 'in_progress') || type === 'sotb-demo' || type === 'uncharted-turretory-demo')) &&
    !(item.label === 'Predictions' && ['paddock-politicks', 'the-oval-offset'].includes(type))
  )

  return (
    <main className="mobile-shrink-main" style={mainStyle}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {(() => {
          // Demo leagues point to their real fandom's hub; sandbox has no hub
          const hubType = type === 'sotb-demo' ? 'secrets-on-the-beach'
            : type === 'uncharted-turretory-demo' ? 'uncharted-turretory'
            : type
          const hasHub = ['secrets-on-the-beach', 'uncharted-turretory'].includes(hubType)
          return (
            <a href={hasHub ? `/leagues/${hubType}` : '/'} style={{
              color: '#a0a0b0',
              fontSize: '0.85rem',
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: '24px'
            }}>
              ← Back to {hasHub ? leagueTypeLabels[hubType] : 'Trekkon Fantasy Leagues'}
            </a>
          )
        })()}

        {isHome && isGlobalAdmin && !isHost && league.is_private && (
          <div style={{ backgroundColor: '#1a1a2e', border: '1px solid #ff6b6b', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#ff6b6b', fontSize: '0.85rem' }}>
            Viewing league controls as Global Admin.
          </div>
        )}

        <div style={{ textAlign: 'left', marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>                <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', margin: 0, lineHeight: '1.2' }}>
                  <Link href={basePath} className={isHome ? undefined : 'league-title-link'} style={{ textDecoration: 'none' }}>
                    {type === 'sotb-demo' && league.name.includes('Demo!') ? (
                      <>
                        <span style={{ color: '#f0b429' }}>{league.name.replace('Demo!', '').trim()}</span>{' '}
                        <span style={{ color: '#ffffff' }}>Demo!</span>
                      </>
                    ) : (
                      <span style={{ color: '#f0b429' }}>{league.name}</span>
                    )}
                  </Link>
                </h1>

                {myLeagues.length > 1 && (
                  <>
                    <button
                      onClick={() => setSwitcherOpen(!switcherOpen)}
                      aria-label="Switch league"
                      style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex' }}
                    >
                      <ChevronDown
                        size={26}
                        color="#f0b429"
                        strokeWidth={2.5}
                        style={{ transition: 'transform 0.2s ease', transform: switcherOpen ? 'rotate(180deg)' : 'none' }}
                      />
                    </button>

                                {switcherOpen && (
                      <div style={{ flexBasis: '100%', display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', marginBottom: '16px' }}>
                        {myLeagues.map((l) => {
                          const isCurrent = l.slug === instance
                          return (
                            <button
                              key={l.slug}
                              onClick={() => {
                                setSwitcherOpen(false)
                                if (!isCurrent) {
                                  window.location.href = pathname.replace(basePath, `/leagues/${type}/${l.slug}`)
                                }
                              }}
                              style={{
                                ...pillButton(isCurrent ? '#f0b429' : '#a0a0b0'),
                                backgroundColor: isCurrent ? 'rgba(240, 180, 41, 0.12)' : 'transparent',
                                fontWeight: isCurrent ? 'bold' : 'normal',
                                fontFamily: 'inherit',
                                cursor: isCurrent ? 'default' : 'pointer'
                              }}
                            >
                              {l.name}
                            </button>
                          )
                                            })}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p style={{ color: '#a0a0b0', fontSize: '1.1rem', margin: '0px 0 0px' }}>
                {league.is_private && maxMembers
                  ? `${memberCount ?? '...'}/${maxMembers} Players`
                  : league.max_members
                  ? `${memberCount ?? '...'}/${league.max_members} Players`
                  : `${memberCount ?? '...'} Players`}
                {isMember && memberTier ? (
                  <span style={{ color: '#a0a0b0' }}>
                    {' '}· You&apos;re in!
                  </span>
                ) : league.draft_status === 'in_progress' ? (
                  <span style={{ color: '#a0a0b0' }}>
                    {' '}·{' '}
                    <Lock size={18} strokeWidth={2} color="#a0a0b0" style={{ display: 'inline-block', verticalAlign: '-1.5px' }} />
                    {' '}Drafting
                  </span>
                ) : hasDrafted && !isReturning && freeAgentPool.length < minFreeAgents ? (
                  <span style={{ color: '#a0a0b0' }}>
                    {' '}·{' '}
                    <Lock size={18} strokeWidth={2} color="#a0a0b0" style={{ display: 'inline-block', verticalAlign: '-1.5px' }} />
                    {' '}Registration Closed
                  </span>
                ) : null}
              </p>
            </div>

            <div>
              {isMember ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                  {memberTier !== 'teamprincipal' && (
                    <a href="/account" className="btn" style={pillButton('#f0b429')}>
                      Upgrade Tier
                    </a>
                  )}
                  {!isHost && league.draft_status !== 'in_progress' && (
                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      disabled={leaving}
                      style={{ ...pillButton('#ff6b6b'), cursor: leaving ? 'not-allowed' : 'pointer' }}
                    >
                      {leaving ? 'Leaving...' : 'Leave League'}
                    </button>
                  )}
                </div>
              ) : league.draft_status === 'in_progress' ? null
                : isReturning ? (
                <button onClick={handleClimbAboard} style={{ ...pillButton('#068e38'), backgroundColor: 'rgba(6, 142, 56, 0.35)', color: '#ffffff' }}>
                  Rejoin League
                </button>
              ) : hasDrafted ? (
                freeAgentPool.length >= minFreeAgents ? (
                  <button onClick={handleClimbAboard} style={{ ...pillButton('#068e38'), backgroundColor: 'rgba(6, 142, 56, 0.35)', color: '#ffffff' }}>
                    Claim Players
                  </button>
                ) : null
              ) : (
                <button onClick={handleClimbAboard} style={{ ...pillButton('#068e38'), backgroundColor: 'rgba(6, 142, 56, 0.35)', color: '#ffffff' }}>
                  Join League
                </button>
              )}
            </div>
          </div>

          {league.is_frozen && (
            <div style={{
              backgroundColor: '#2a1a1a',
              border: '1px solid #ff6b6b',
              borderRadius: '10px',
              padding: '14px 20px',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                🚩 This league is currently in pit lane as the host&apos;s membership dropped below Crew Chief. Racing will resume once they re-upgrade.
              </p>
            </div>
          )}

                   {league.champion_names && league.champion_names.length > 0 && (
                     <div ref={champRef} style={{
              position: 'relative',
              zIndex: 61,
              overflow: 'hidden',
              textAlign: 'center',
                            backgroundColor: '#1a1a2e',
              ...(welcomeTextureByType[type] && {
                backgroundImage: `linear-gradient(rgba(26, 26, 46, 0.35), rgba(26, 26, 46, 0.4)), url('${welcomeTextureByType[type]}')`,
                backgroundSize: '400px',
                backgroundPosition: 'center',
              }),
              border: '1.5px solid #f0b429',
              borderRadius: '12px',
              padding: '20px 24px',
              marginTop: '16px',
              marginBottom: '48px',
              boxShadow: '0 0 30px rgba(240, 180, 41, 0.3)'
            }}>
              {/* Pulsing glow */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #f0b4292e 0%, transparent 70%)',
                pointerEvents: 'none',
                animation: 'champGlow 3s ease-in-out infinite'
              }} />

              {/* Floating sparkles (fixed spots so they don't jump around on re-render) */}
              {[...Array(16)].map((_, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${40 + ((i * 37) % 55)}%`,
                    left: `${4 + ((i * 61) % 92)}%`,
                    width: i % 4 === 0 ? '5px' : '3px',
                    height: i % 4 === 0 ? '5px' : '3px',
                    borderRadius: '50%',
                    backgroundColor: i % 3 === 0 ? '#f5ff9c' : '#f0b429',
                    pointerEvents: 'none',
                    opacity: 0,
                    animation: `champFloat ${3 + (i % 4) * 0.7}s ease-in-out ${(i % 6) * 0.5}s infinite`
                  }}
                />
              ))}

              <p style={{
                position: 'relative',
                color: '#f0b429',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                margin: '0 0 6px 0'
              }}>
                In the Record Books
              </p>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.4rem)', fontWeight: 'bold' }}>
                  Congrats to our league champion,{' '}
                  <span style={{ color: '#f0b429', animation: 'champTitle 2.5s ease-in-out infinite' }}>
                    {league.champion_names.join(' & ')}
                  </span>!
                </span>
              </div>
              <p style={{ position: 'relative', color: '#a0a0b0', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
                <Link href={`${basePath}/leaderboard`} style={{ color: '#f0b429', textDecoration: 'underline' }}>
                  Final Standings
                </Link>
              </p>

              <style>{`
                @keyframes champGlow {
                  0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
                  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
                }
                @keyframes champFloat {
                  0% { transform: translateY(0); opacity: 0; }
                  20% { opacity: 0.8; }
                  80% { opacity: 0.8; }
                  100% { transform: translateY(-90px); opacity: 0; }
                }
                @keyframes champTitle {
                  0%, 100% { text-shadow: 0 0 20px #f0b42988, 0 0 40px #f0b42944; }
                  50% { text-shadow: 0 0 30px #f0b429cc, 0 0 60px #f0b42966; }
                }
              `}</style>
            </div>
          )}

                    {burstOrigin && (
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 60 }}>
              {[...Array(40)].map((_, i) => {
                const angle = (i / 40) * Math.PI * 2 + (i % 3) * 0.15
                const distance = 25 + (i % 5) * 9 // 25–61 (% of screen)
                const size = i % 5 === 0 ? 7 : i % 2 === 0 ? 5 : 3
                return (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      left: burstOrigin.x,
                      top: burstOrigin.y,
                      width: `${size}px`,
                      height: `${size}px`,
                      borderRadius: '50%',
                      backgroundColor: i % 3 === 0 ? '#f5ff9c' : i % 7 === 0 ? '#ffffff' : '#f0b429',
                      boxShadow: '0 0 8px rgba(240, 180, 41, 0.8)',
                      ['--dx' as string]: `${Math.cos(angle) * distance}vw`,
                      ['--dy' as string]: `${Math.sin(angle) * distance}vh`,
                      animation: `champBurst ${2.2 + (i % 4) * 0.4}s cubic-bezier(0.15, 0.7, 0.3, 1) ${(i % 5) * 0.08}s forwards`,
                      opacity: 0
                    } as React.CSSProperties}
                  />
                )
              })}
              <style>{`
                @keyframes champBurst {
                  0% { transform: translate(0, 0) scale(1.4); opacity: 1; }
                  70% { opacity: 0.9; }
                  100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
                }
              `}</style>
            </div>
          )}

          {isHome && (isHost || isGlobalAdmin) && league.is_private && (
            <div style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #f0b429',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '20px',
              marginTop: '16px'
            }}>
              <p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '8px' }}>
                Share to invite players into <strong>this</strong> private league (anyone with link can join):
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  readOnly
                  value={`${window.location.origin}/leagues/${type}/join/${league.invite_token}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #2a2a3e',
                    backgroundColor: '#12121a',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    textOverflow: 'ellipsis'
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/leagues/${type}/join/${league.invite_token}`)
                    if (navigator.vibrate) {
                      navigator.vibrate(50)
                    }
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  style={{
                    backgroundColor: copied ? '#068e38' : '#f0b429',
                    color: copied ? '#ffffff' : '#0a0a0f',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div style={{ marginTop: '-4px', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <a href={`${basePath}/host-settings`}
                  className="btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#f0b429',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Cog size={16} color="#ffffff" strokeWidth={2} style={{ flexShrink: 0 }} /> League Settings
                </a>
                {league.allow_custom_scoring && (isGlobalAdmin || hostTier === 'teamprincipal') && (
                  <a href={`${basePath}/custom-scoring`}
                    className="btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#f0b429',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Palette size={16} color="#ffffff" strokeWidth={2} style={{ flexShrink: 0 }} /> Custom Scoring
                  </a>
                )}
              </div>
            </div>
          )}

          {isHome && (isHost || isGlobalAdmin) && league.is_private && !hasDrafted && league.draft_status !== 'in_progress' && league.draft_status !== 'completed' && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowStartDraftConfirm(true)}
                className="league-card"
                style={{
                  backgroundColor: '#068e38',
                  color: '#ffffff',
                  border: '2px solid #ffff',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {league.draft_mode === 'auto' ? 'Run Offline Draft' : 'Start Live Draft'}
              </button>
            </div>
          )}

          {/* ─── ICON TRAY ─── */}
          <div style={{ position: 'relative', marginTop: '12px', marginBottom: '32px' }}>
            <div
              className="tool-grid tool-scroll"
              onScroll={(e) => {
                const el = e.currentTarget
                setToolsAtStart(el.scrollLeft <= 4)
                setToolsAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
              }}
              style={{
                maxWidth: '800px',
                display: 'flex',
                flexWrap: isMobileWidth ? 'nowrap' : 'wrap',
                overflowX: isMobileWidth ? 'auto' : 'visible',
                scrollbarWidth: 'none',
                rowGap: '20px',
                justifyContent: isMobileWidth ? 'flex-start' : 'center',
                columnGap: isMobileWidth ? '3%' : '8px',
                padding: isMobileWidth ? '14px 0' : '0',
                margin: isMobileWidth ? '-14px 0' : '0',
              }}
            >
              {toolItems.map((page) => {
                const Icon = page.icon
                const isDraftRoomTile = page.label === 'Draft Room'
                const shouldPulse = isDraftRoomTile && league.draft_status === 'in_progress'
                const hrefPath = page.href ? page.href.split('?')[0] : null
                const isActive = !!hrefPath && pathname.startsWith(hrefPath)

                const content = (
                  <>
                    <div
                      className={shouldPulse ? 'draft-room-emoji' : ''}
                      style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}
                    >
                      <Icon size={isMobileWidth ? 26 : 34} strokeWidth={isActive ? 2 : 1.5} color={isActive ? '#f0b429' : '#a0a0b0'} />
                    </div>
                                      <div style={{
                      fontSize: isMobileWidth ? '0.65rem' : '0.8rem',
                      lineHeight: 1.2,
                      textAlign: 'center',
                      color: isActive ? 'rgb(245, 255, 156)' : undefined
                    }}>
                      {page.label}
                    </div>
                  </>
                )
                const cardStyle: React.CSSProperties = {
                  borderRadius: '10px',
                  padding: '0px 0px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: '#ffffff',
                  flex: isMobileWidth ? '0 0 21%' : '1 0 72px',
                  minWidth: 0,
                }

                if (page.label === 'Research') {
                  return (
                    <div key={page.label} className="subpage-card" style={cardStyle} onClick={() => setShowResources(true)}>
                      {content}
                    </div>
                  )
                }

                return (
                  <Link
                    key={page.label}
                    href={page.href!}
                    className={`subpage-card ${shouldPulse ? 'draft-pulse' : ''}`}
                    style={cardStyle}
                  >
                    {content}
                  </Link>
                )
              })}
            </div>

            {isMobileWidth && !toolsAtStart && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                background: 'linear-gradient(to left, transparent, rgba(10, 10, 15, 0.9))',
                pointerEvents: 'none'
              }}>
                <ChevronLeft size={22} color="#f0b429" strokeWidth={2.5} className="draft-room-emoji" />
              </div>
            )}

            {isMobileWidth && toolItems.length > 4 && !toolsAtEnd && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                background: 'linear-gradient(to right, transparent, rgba(10, 10, 15, 0.9))',
                pointerEvents: 'none'
              }}>
                <ChevronRight size={22} color="#f0b429" strokeWidth={2.5} className="draft-room-emoji" />
              </div>
            )}
          </div>
        </div>

        {/* ─── PAGE CONTENT ─── */}
        {children}
      </div>

    {isGlobalAdmin && !league.is_private && (
        <div style={{
          maxWidth: '800px',
          margin: '48px auto 0',
          paddingTop: '12px',
          borderTop: '1px solid #2a2a3e',
          display: 'flex',
          flexWrap: isMobileWidth ? 'nowrap' : 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: isMobileWidth ? '14px' : '8px',
          fontSize: isMobileWidth ? '0.8rem' : '1rem',
          whiteSpace: 'nowrap',
          color: '#f0b429'
        }}>
          {!isMobileWidth && <span>Global Admin:</span>}
          <a href={`${basePath}/host-settings`} style={{ color: '#a0a0b0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Cog size={14} color="#a0a0b0" strokeWidth={2} /> League Settings
          </a>
          {league.allow_custom_scoring && (
            <a href={`${basePath}/custom-scoring`} style={{ color: '#a0a0b0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: isMobileWidth ? '0' : '12px' }}>
              <Palette size={14} color="#a0a0b0" strokeWidth={2} /> Custom Scoring
            </a>
          )}
          {!hasDrafted && league.draft_status !== 'in_progress' && league.draft_status !== 'completed' && (
            <button
              onClick={() => setShowStartDraftConfirm(true)}
              style={{ background: 'none', border: 'none', padding: 0, marginLeft: isMobileWidth ? '0' : '12px', color: '#068e38', fontSize: 'inherit', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {league.draft_mode === 'auto'
                ? <><Shuffle size={14} color="#ffffff" strokeWidth={2} /> Run Offline Draft</>
                : <><Play size={14} color="#ffffff" strokeWidth={2} /> Start Live Draft</>}
            </button>
          )}
        </div>
      )}

      {showJoinModal && (
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
            padding: '32px',
            maxWidth: '380px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#f0b429', fontSize: '1.4rem', marginBottom: '12px' }}>
              Power up for your leagues!
            </h3>
            <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Upgrade to{' '}
              {myTier === 'castaway'
                ? 'Crew Chief or Team Principal'
                : myTier === 'crewchief'
                ? 'Team Principal'
                : 'Castaway, Crew Chief, or Team Principal'}{' '}
              to make the most of your fantasy league experience in community!
            </p>
            {joinMessage ? (
              <div>
                <p style={{ color: '#f0b429', fontWeight: 'bold', marginBottom: '16px' }}>{joinMessage}</p>
                <button
                  onClick={() => setShowJoinModal(false)}
                  style={{
                    backgroundColor: '#f0b429',
                    color: '#0a0a0f',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Got it!
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => router.push('/account')} style={{
                  backgroundColor: '#f0b429',
                  color: '#0a0a0f',
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  Upgrade
                </button>
                <button onClick={confirmJoin} disabled={joining} style={{
                  backgroundColor: 'transparent',
                  color: '#a0a0b0',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #2a2a3e',
                  cursor: joining ? 'not-allowed' : 'pointer'
                }}>
                  {joining ? 'Joining...' : `Continue as ${tierLabels[myTier] ?? myTier}`}
                </button>
                <button onClick={() => setShowJoinModal(false)} style={{
                  backgroundColor: 'transparent',
                  color: '#555570',
                  padding: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={showStartDraftConfirm}
        title="Start the Draft?"
        message={
          league.draft_mode === 'auto'
            ? [
                'This runs the entire draft at once. Each player gets their highest-ranked pick still available, and players without rankings get random picks.',
                'Results are final once the draft runs, and every player is notified.',
              ]
            : [
                draftWindowByLeague[type]
                  ? `The draft window for ${draftWindowByLeague[type].name} runs ${draftWindowByLeague[type].window}. League hosts are responsible for communicating draft start times, selection time limits, consequences of missing picks, etc.`
                  : 'League hosts are responsible for communicating draft start times, selection time limits, consequences of missing picks, etc.',
                'Clicking "Start Draft" will immediately start the selection timer for the first player up.',
                'Note: All players should be actively engaged in your draft window (whether it lasts 15 minutes or 2 days).',
              ]
        }
        confirmText={startingDraft ? 'Starting...' : league.draft_mode === 'auto' ? 'Run Draft' : 'Start Draft'}
        onConfirm={() => { setShowStartDraftConfirm(false); handleStartDraft() }}
        onCancel={() => setShowStartDraftConfirm(false)}
      />

      <ConfirmModal
        open={showLeaveConfirm}
        title="Leave league?"
        message="Are you sure you want to leave this league?"
        confirmText="Leave League"
        danger
        onConfirm={() => { setShowLeaveConfirm(false); handleLeave() }}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      <ResourcesModal open={showResources} onClose={() => setShowResources(false)} type={type} />

      {user && (
        <FreeAgentClaimModal
          open={showFreeAgentModal}
          leagueId={league.id}
          leagueName={league.name}
          leagueSlug={instance}
          leagueType={type}
          userId={user.id}
          pool={freeAgentPool}
          castawayTerm={castawayTerm}
          requiredCount={replaceCount ?? (league.draft_rounds ?? 4)}
          isReplacement={replaceCount !== null}
          onClose={() => {
            setShowFreeAgentModal(false)
            if (replaceCount !== null) window.location.reload()
          }}
          onClaimed={() => {
            setShowFreeAgentModal(false)
            if (replaceCount === null) {
              setIsMember(true)
              setMemberCount((prev) => (prev ?? 0) + 1)
            }
            window.location.reload()
          }}
        />
      )}

      {showWelcomeToast && (
        <div
          onClick={() => setShowWelcomeToast(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 10, 15, 0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'pointer',
            animation: 'welcomeFade 0.3s ease-out'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #f0b4292e 0%, #f0b42910 35%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'welcomeGlow 3s ease-in-out infinite'
          }} />

          {[...Array(18)].map((_, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: `${30 + Math.random() * 50}%`,
                left: `${5 + Math.random() * 90}%`,
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: i % 3 === 0 ? '#f5ff9c' : '#f0b429',
                pointerEvents: 'none',
                animation: `welcomeFloat ${3 + Math.random() * 3}s ease-in-out ${Math.random() * 1.5}s infinite`
              }}
            />
          ))}

          <div style={{
            position: 'relative',
            width: 'min(90vw, 420px)',
            backgroundColor: '#1a1a2e',
            ...(welcomeTextureByType[type] && {
              backgroundImage: `url('${welcomeTextureByType[type]}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }),
            border: '1.5px solid #f0b429',
            borderRadius: '14px',
            overflow: 'hidden',
            padding: '28px 32px',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(240, 180, 41, 0.3), 0 8px 24px rgba(0, 0, 0, 0.5)',
            animation: 'welcomePop 0.4s ease-out'
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.9rem',
              fontWeight: 'bold',
              margin: 0,
              animation: 'welcomeTitle 2.5s ease-in-out infinite'
            }}>
              {(welcomeByLeague[type] ?? defaultWelcome).title}
            </h2>

            <div style={{
              width: '70px',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #f0b429, transparent)',
              margin: '16px auto'
            }} />

            <p style={{
              color: '#ffffff',
              fontSize: '1rem',
              lineHeight: 1.5,
              margin: 0,
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)'
            }}>
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                {(welcomeByLeague[type] ?? defaultWelcome).before}
              </span>{' '}
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#f0b429', fontWeight: 'bold' }}>{league.name}</span>
                {(welcomeByLeague[type] ?? defaultWelcome).after}
              </span>
            </p>
          </div>

          <style>{`
            @keyframes welcomeFade {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes welcomePop {
              0% { opacity: 0; transform: scale(0.85); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes welcomeGlow {
              0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
            }
            @keyframes welcomeTitle {
              0%, 100% { text-shadow: 0 0 30px #f0b42988, 0 0 60px #f0b42944; }
              50% { text-shadow: 0 0 40px #f0b429aa, 0 0 80px #f0b42966; }
            }
            @keyframes welcomeFloat {
              0% { transform: translateY(0); opacity: 0; }
              20% { opacity: 0.7; }
              80% { opacity: 0.7; }
              100% { transform: translateY(-140px); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </main>
  )
}