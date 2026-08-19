'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

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
}

export default function LeagueInstancePage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const { user, loading } = useAuth()
  const router = useRouter()

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

  useEffect(() => {
    if (type === 'potb-demo') {
      router.push('/leagues/potb-demo/sample-league')
    }
  }, [type])

  useEffect(() => {
    async function loadLeague() {
      const { data: leagueData } = await supabase
        .from('leagues')
        .select('*')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()

      setLeague(leagueData)

      if (leagueData && user && leagueData.host_user_id === user.id) {
        setIsHost(true)
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
          const cap = hostProfile?.tier === 'teamprincipal' ? 18 : 8
          setMaxMembers(cap)
        }

        const { count: pickCount } = await supabase
          .from('draft_picks')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', leagueData.id)
        setHasDrafted((pickCount ?? 0) > 0)

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
        }
      }

      setPageLoading(false)
    }

    if (!loading) {
      loadLeague()
    }
  }, [type, instance, user, loading])

  const leagueTypeLabels: Record<string, string> = {
  'politics-on-the-beach': 'Politics on the Beach',
  'americans-turning-left': "'Muricans Turn Left",
  'european-rocket-ships': 'European Rockets',
}
  
const handleClimbAboard = () => {
  if (!user) {
    router.push('/login')
    return
  }
  setShowJoinModal(true)
  if (myTier !== 'stowaway') {
    confirmJoin()
  }
}

  const confirmJoin = async () => {
    if (!user || !league) return
    setJoining(true)
    setJoinMessage('')

    if (league.max_members) {
      const { count } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id)

      if (count !== null && count >= league.max_members) {
        setJoinMessage('This league is full... Island hop to find another!')
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

    const { count: pickCount } = await supabase
      .from('draft_picks')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id)

    if (pickCount && pickCount > 0) {
      setJoinMessage('This league has already drafted. Registration is closed.')
      setJoining(false)
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
  const confirmed = window.confirm('Are you sure you want to leave this league?')
    if (!confirmed) return
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

  const tierLabels: Record<string, string> = {
    stowaway: 'Stowaway',
    castaway: 'Castaway',
    crewchief: 'Crew Chief',
    teamprincipal: 'Team Principal',
  }

  if (loading || pageLoading) {
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

  if (!league) {
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
        gap: '16px'
      }}>
        <p>Sorry, that league doesn&apos;t exist yet. Try again or ask our team with questions!</p>
        <a href={`/leagues/${type}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to 🌴 Politics on the Beach
        </a>
      </main>
    )
  }

  const toolGroups = [
    {
      label: 'Standings, Draft & Community Tools:',
      items: [
        { label: 'Leaderboard', emoji: '🏆', href: `/leagues/${type}/${instance}/leaderboard` },
        { label: 'Scoring Log', emoji: '🧮', href: `/leagues/${type}/scoring-log?from=${instance}` },
        { label: 'Analytics', emoji: '📈', href: `/leagues/${type}/${instance}/analytics` },
        { label: 'League Roster', emoji: '👥', href: `/leagues/${type}/${instance}/roster` },
        { label: 'Draft Log', emoji: '📜', href: `/leagues/${type}/${instance}/draft-log` },
        { label: 'Trade Portal (Building)', emoji: '🔄' },
        { label: 'League Chat (Building)', emoji: '💬' },
      ],
    },
  ]

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '60px 40px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
<button onClick={() => router.back()} style={{
  background: 'none',
  border: 'none',
  color: '#a0a0b0',
  fontSize: '0.85rem',
  cursor: 'pointer',
  padding: 0,
  marginBottom: '24px',
  fontFamily: 'inherit',
  display: 'inline-block'
}}>
  ← Back to Previous Page
</button>

        <div style={{ textAlign: 'left', marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>
              {type === 'potb-demo' && league.name.includes('Demo!') ? (
                <>
                  <span style={{ color: '#f0b429' }}>{league.name.replace('Demo!', '').trim()}</span>{' '}
                  <span style={{ color: '#ffffff' }}>Demo!</span>
                </>
              ) : (
                <span style={{ color: '#f0b429' }}>{league.name}</span>
              )}
            </h1>
            <p style={{ color: '#555570', fontSize: '1.75rem', margin: 0 }}>
              {league.is_private && maxMembers
                ? `${memberCount ?? '...'} / ${maxMembers}`
                : league.max_members
                ? `${memberCount ?? '...'} / ${league.max_members}`
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

          {isHost && league.is_private && (
            <div style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #f0b429',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '24px'
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
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #2a2a3e',
                    backgroundColor: '#12121a',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/leagues/${type}/join/${league.invite_token}`)
                  }}
                  style={{
                    backgroundColor: '#f0b429',
                    color: '#0a0a0f',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              </div>

              <div style={{ marginTop: '-4px', paddingTop: '16px'}}>
                <a
                  href={`/leagues/${type}/${instance}/host-settings`}
                  className="btn"
                  style={{
                    display: 'inline-block',
                    color: '#f0b429',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    marginRight: '16px'
                  }}
                >
                  ⚙️ League Settings <span className="demo-arrow">→</span>
                </a>
                
              </div>
            </div>
          )}

          <div style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
            {toolGroups.map((group) => (
              <div key={group.label}>
                <div style={{ color: '#a0a0b0', fontSize: '1rem', marginBottom: '20px' }}>
                  {group.label}
                </div>
                <div className="tool-grid" style={{ maxWidth: `${group.items.length * 140}px` }}>
                  {group.items.map((page) => {
                    const content = (
                      <>
                        <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{page.emoji}</div>
                        <div style={{ fontSize: '1rem' }}>{page.label}</div>
                      </>
                    )
                    const cardStyle = {
                      borderRadius: '10px',
                      padding: '0px 0px',
                      textAlign: 'center' as const,
                      textDecoration: 'none',
                      color: page.href ? '#ffffff' : '#555570',
                    }
                    return page.href ? (
                      <a key={page.label} href={page.href} className="subpage-card" style={cardStyle}>
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
            maxWidth: '600px'
          }}>
            {isMember ? (
              <div>
                <p style={{
                  color: '#f0b429',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  marginTop: '8px',
                  whiteSpace: 'nowrap'
                }}>
                  You&apos;re in the league, {tierLabels[memberTier ?? ''] ?? memberTier}!
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                  gap: '12px'
                }}>
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
{!isHost && (
  <button
    onClick={handleLeave}
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
              hasDrafted ? (
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
                  <span style={{ fontSize: '2rem' }}>🔒</span>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span>See you next time!</span>
                    <span>Registration&apos;s closed.</span>
                  </div>
                </div>
              ) : (
                <button onClick={handleClimbAboard} style={{
                  backgroundColor: '#f0b429',
                  color: '#0a0a0f',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  letterSpacing: '1.2px',
                  cursor: 'pointer'
                }}>
                  {`Join as ${tierLabels[myTier] ?? myTier}`}
                </button>
              )
            )}
          </div>
        </div>
      </div>

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
    </main>
  )
}