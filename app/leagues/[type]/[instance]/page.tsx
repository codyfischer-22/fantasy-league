'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import ConfirmModal from '@/components/ConfirmModal'
import { Cog, Palette, Trophy, Calculator, TrendingUp, Shuffle, Play, Users, ClipboardList, RefreshCw, Puzzle, Microscope, Lock} from 'lucide-react'
import ResourcesModal from '@/components/ResourcesModal'
import PredictionCard from '@/components/PredictionCard'
import { getFreeAgentPool, type FreeAgent } from '@/lib/freeAgents'
import FreeAgentClaimModal from '@/components/FreeAgentClaimModal'
import { castawayTermByLeague, backgroundsByType } from '@/lib/leagueConfig'
import { runLeagueDraft } from '@/lib/runDraft'

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
}

const draftWindowByLeague: Record<string, { name: string; window: string }> = {
  'secrets-on-the-beach': { name: 'Secrets on the Beach', window: 'September 16-20 (7 PM CT)' },
  'uncharted-turretory': { name: 'Uncharted Turretory', window: 'September 16-17 (7 PM CT)' },
}

export default function LeagueInstancePage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
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
          }
                    else {
            const { count: oldPicks } = await supabase
              .from('draft_picks')
              .select('*', { count: 'exact', head: true })
              .eq('league_id', leagueData.id)
              .eq('user_id', user.id)
            setIsReturning((oldPicks ?? 0) > 0)
          }
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

    router.push(isAuto ? `/leagues/${type}/${instance}/roster` : `/leagues/${type}/${instance}/draft-room`)
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
effectiveCap = league.max_members ?? (hostProfile?.tier === 'teamprincipal' ? 18 : 8)    }
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
      setJoinMessage('Welcome aboard!')
      setIsMember(true)
      setMemberTier(profile?.tier ?? 'stowaway')
      setMemberCount((prev) => (prev ?? 0) + 1)
      await supabase.from('notifications').insert({
        user_id: user.id,
        message: `You've joined ${league.name}! Check out your league to get started.`,
        link: `/leagues/${type}/${instance}`,
      })
      if (league.is_private && league.host_user_id) {
        await supabase.from('notifications').insert({
          user_id: league.host_user_id,
          message: `${profile?.display_name || 'A new Player'} has joined ${league.name}.`,
          link: `/leagues/${type}/${instance}`,
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
              linkUrl: `https://trekkonleagues.com/leagues/${type}/${instance}`,
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
              link: `/leagues/${type}/${instance}`,
            }))
          )
        }
      }
      setTimeout(() => setShowJoinModal(false), 3000)
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
          link: `/leagues/${type}/${instance}`,
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
              linkUrl: `https://trekkonleagues.com/leagues/${type}/${instance}`,
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
              link: `/leagues/${type}/${instance}`,
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

  const tierLabels: Record<string, string> = {
    stowaway: 'Stowaway',
    castaway: 'Castaway',
    crewchief: 'Crew Chief',
    teamprincipal: 'Team Principal',
  }

  if (loading || pageLoading) {
    return (
  <main className="mobile-shrink-main" style={{
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
        Loading...
      </main>
    )
  }

  if (!league) {
    return null
  }

  const toolGroups = [
  {
    label: 'Standings, Draft & Community Tools:',
    items: [
      { label: 'Leaderboard', icon: Trophy, href: `/leagues/${type}/${instance}/leaderboard` },
      { label: 'Scoring Log', icon: Calculator, href: `/leagues/${type}/scoring-log?from=${instance}` },
      { label: 'Analytics', icon: TrendingUp, href: `/leagues/${type}/${instance}/analytics` },
      { label: 'Rosters', icon: Users, href: `/leagues/${type}/${instance}/roster` },
      { label: 'Draft Log', icon: ClipboardList, href: `/leagues/${type}/${instance}/draft-log` },
      { label: 'Trade Portal', icon: RefreshCw, href: `/leagues/${type}/${instance}/trade-portal` },
      { label: 'Draft Room', icon: Puzzle, href: `/leagues/${type}/${instance}/draft-room` },
      { label: 'Draft Research', icon: Microscope, href: null },
    ].filter((item) =>
      !(item.label === 'Draft Room' && (league.draft_mode !== 'live' || league.draft_status === 'completed' || type === 'sotb-demo' || type === 'uncharted-turretory-demo')) &&
      !(item.label === 'Draft Research' && ((hasDrafted && league.draft_status !== 'in_progress') || type === 'sotb-demo' || type === 'uncharted-turretory-demo'))
    ),
  },
]
  return (
<main className="mobile-shrink-main" style={{
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
  <a href="/" style={{
    color: '#a0a0b0',
    fontSize: '0.85rem',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '24px'
  }}>
    ← Back to Trekkon Fantasy Leagues
  </a>

 {isGlobalAdmin && !isHost && league.is_private && (
  <div style={{ backgroundColor: '#1a1a2e', border: '1px solid #ff6b6b', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#ff6b6b', fontSize: '0.85rem' }}>
    Viewing league controls as Global Admin.
  </div>
)}

        <div style={{ textAlign: 'left', marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '8px'
          }}>
            <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', margin: 0, lineHeight: '1.2' }}>
              {type === 'sotb-demo' && league.name.includes('Demo!') ? (
                <>
                  <span style={{ color: '#f0b429' }}>{league.name.replace('Demo!', '').trim()}</span>{' '}
                  <span style={{ color: '#ffffff' }}>Demo!</span>
                </>
              ) : (
                <span style={{ color: '#f0b429' }}>{league.name}</span>
              )}
            </h1>
            <p style={{ color: '#555570', fontSize: '1.1rem', margin: '0px 0 0px' }}>
              {league.is_private && maxMembers
                ? `${memberCount ?? '...'} / ${maxMembers} Spots Filled`
                : league.max_members
                ? `${memberCount ?? '...'} / ${league.max_members} Spots Filled`
                : `${memberCount ?? '...'} Members`}
            </p>
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

         {(isHost || isGlobalAdmin) && league.is_private && (
            <div style={{
    backgroundColor: '#1a1a2e',
    border: '1px solid #f0b429',
    borderRadius: '10px',
    padding: '16px 20px',
    marginBottom: '20px',
    marginTop: '16px'
  }}>
    {league.is_private && (
      <>
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
    backgroundColor: copied ? '#2bda25' : '#f0b429',
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
     </>
    )}
    
    <div style={{ marginTop: league.is_private ? '-4px' : '0', paddingTop: league.is_private ? '16px' : '0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>      <a href={`/leagues/${type}/${instance}/host-settings`}
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
                <a href={`/leagues/${type}/${instance}/custom-scoring`}
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

{(isHost || isGlobalAdmin) && league.is_private && !hasDrafted && league.draft_status !== 'in_progress' && league.draft_status !== 'completed' && (
  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
    <button
      onClick={() => setShowStartDraftConfirm(true)}
      className="league-card"
      style={{
        backgroundColor: '#2bda25',
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

          <div style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px', marginBottom: '40px' }}>
            {toolGroups.map((group) => (
              <div key={group.label}>
                <div style={{ color: '#a0a0b0', fontSize: '1rem', marginBottom: '16px' }}>
                  {group.label}
                </div>
  <div
  className="tool-grid"
  style={{
    maxWidth: '800px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    rowGap: '36px',
    columnGap: '20px'
  }}
>
                 {group.items.map((page) => {
const Icon = page.icon
const isDraftRoomTile = page.label === 'Draft Room'
const shouldPulse = isDraftRoomTile && league.draft_status === 'in_progress'

const content = (
  <>
    <div
      className={shouldPulse ? 'draft-room-emoji' : ''}
      style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}
    >
      <Icon size={50} strokeWidth={1.5} color="rgb(245, 255, 156)" />
    </div>
    <div style={{ fontSize: '1rem', textAlign: 'center' }}>{page.label}</div>
  </>
)
  const cardStyle = {
  borderRadius: '10px',
  padding: '0px 0px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  color: page.href ? '#ffffff' : '#555570',
  flex: isMobileWidth ? '0 0 40%' : '0 0 auto',
  maxWidth: isMobileWidth ? '40%' : 'none',
}

  if (page.label === 'Draft Research') {
    return (
      <div
        key={page.label}
        className="subpage-card"
        style={{ ...cardStyle, color: '#ffffff' }}
        onClick={() => setShowResources(true)}
      >
        {content}
      </div>
    )
  }

  return page.href ? (
    <a
      key={page.label}
      href={page.href}
      className={`subpage-card ${shouldPulse ? 'draft-pulse' : ''}`}
      style={cardStyle}
    >
      {content}
    </a>
  ) : (
    <div key={page.label} className="subpage-card" style={cardStyle}>
      {content}
    </div>
  )
})}
                </div>
              </div>
            ))}
          </div>


        <div style={{
    border: 'none',
    borderRadius: '10px',
    padding: '0px',
    maxWidth: '800px'
  }}>
    {isMember ? (
      <div>
{!['paddock-politicks', 'the-oval-offset'].includes(type) && (
  <PredictionCard leagueId={league.id} leagueType={type} instanceSlug={instance} />
)}

        <p className="league-welcome-text" style={{
                  color: '#f0b429',
                  fontSize: 'clamp(1.4rem, 5vw, 1.5rem)',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  marginTop: '8px',
                  whiteSpace: 'nowrap'
                }}>
                  You&apos;re in the league,<br className="league-welcome-break" /> {tierLabels[memberTier ?? ''] ?? memberTier}!
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                  gap: '12px'
                }}>
                  {(!hasDrafted || league.draft_status === 'in_progress') && (
                                                            <a href={`/leagues/${type}/${instance}/rankings`} className="btn" style={{
                      display: 'inline-block',
                      backgroundColor: 'transparent',
                      border: '1px solid #f0b429',
                      color: '#ffffff',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      Submit Draft Rankings
                    </a>
                  )}
                  <a href="/account" className="btn" style={{
                    display: 'inline-block',
                    backgroundColor: 'transparent',
                    color: '#f0b429',
                    border: '1px solid #f0b429',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}>
                    {memberTier === 'teamprincipal' ? 'Manage Membership' : 'Upgrade Membership'}
                  </a>
               {!isHost && league.draft_status !== 'in_progress' && (
                                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      disabled={leaving}
                      style={{
                        display: 'inline-block',
                        backgroundColor: 'transparent',
                        color: '#ff6b6b',
                        border: '1px solid #ff6b6b',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        cursor: leaving ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {leaving ? 'Leaving...' : 'Leave League'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
             league.draft_status === 'in_progress' ? (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '14px',
      backgroundColor: '#1a1a2e',
      color: '#555570',
      padding: '14px 32px',
      borderRadius: '8px',
      border: '1px solid #2a2a3e',
      fontWeight: 'bold',
      fontSize: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Lock size={32} strokeWidth={2} color="#f0b429" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <span>Registration will reopen after active draft if enough {castawayTerm.toLowerCase()}s remain.</span>
      </div>
    </div>
  ) : isReturning ? (
    <button onClick={handleClimbAboard} style={{
      backgroundColor: '#f0b429',
      color: '#0a0a0f',
      padding: '14px 32px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: 'bold',
      fontSize: '1rem',
      cursor: 'pointer'
    }}>
      Rejoin League
    </button>
  ) : hasDrafted ? (
    freeAgentPool.length >= minFreeAgents ? (
        <button onClick={() => setShowFreeAgentModal(true)} style={{
      backgroundColor: '#f0b429',
      color: '#0a0a0f',
      padding: '14px 32px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: 'bold',
      fontSize: '1rem',
      cursor: 'pointer'
    }}>
      Claim Players
    </button>
  ) : (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '14px',
      backgroundColor: '#1a1a2e',
      color: '#555570',
      padding: '14px 32px',
      borderRadius: '8px',
      border: '1px solid #2a2a3e',
      fontWeight: 'bold',
      fontSize: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Lock size={32} strokeWidth={2} color="#f0b429" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span>See you next time!</span>
        <span>Registration&apos;s closed.</span>
      </div>
    </div>
  )
) : (
  <button onClick={handleClimbAboard}>
    {`Join as ${tierLabels[myTier] ?? myTier}`}
  </button>
)
            )}
          </div>
        </div>
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
          color: '#555570'
        }}>
          {!isMobileWidth && <span>Global Admin:</span>}
          <a href={`/leagues/${type}/${instance}/host-settings`} style={{ color: '#a0a0b0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Cog size={14} color="#a0a0b0" strokeWidth={2} /> League Settings
          </a>
          {league.allow_custom_scoring && (
            <a href={`/leagues/${type}/${instance}/custom-scoring`} style={{ color: '#a0a0b0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: isMobileWidth ? '0' : '12px' }}>
              <Palette size={14} color="#a0a0b0" strokeWidth={2} /> Custom Scoring
            </a>
          )}
          {!hasDrafted && league.draft_status !== 'in_progress' && league.draft_status !== 'completed' && (
            <button
              onClick={() => setShowStartDraftConfirm(true)}
              style={{ background: 'none', border: 'none', padding: 0, marginLeft: isMobileWidth ? '0' : '12px', color: '#2bda25', fontSize: 'inherit', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
              Upgrade to Castaway, Crew Chief, or Team Principal to make the most of your
              fantasy league experience in community!
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
  
</main>
  )
}