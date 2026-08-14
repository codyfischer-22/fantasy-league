'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import React from 'react'

type League = {
  id: number
  name: string
  slug: string
  league_type: string
  is_private: boolean
  max_members: number | null
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

  useEffect(() => {
    async function loadLeague() {
      const { data: leagueData } = await supabase
        .from('leagues')
        .select('*')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()

      setLeague(leagueData)

      if (leagueData) {
        const { count } = await supabase
          .from('league_members')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', leagueData.id)

        setMemberCount(count)

        const { count: pickCount } = await supabase
  .from('draft_picks')
  .select('*', { count: 'exact', head: true })
  .eq('league_id', leagueData.id)

setHasDrafted((pickCount ?? 0) > 0)

        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('tier')
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

  const handleClimbAboard = () => {
    if (!user) {
      router.push('/login')
      return
    }
    setShowJoinModal(true)
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

  const { count: pickCount } = await supabase
    .from('draft_picks')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', league.id)

  if (pickCount && pickCount > 0) {
    setJoinMessage('This league has already drafted — registration is closed.')
    setJoining(false)
    return
  }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('user_id', user.id)
      .single()

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
      setTimeout(() => setShowJoinModal(false), 3000)
    }
  }

  const handleLeave = async () => {
    if (!user || !league) return

    const confirmed = window.confirm('Are you sure you want to leave this league?')
    if (!confirmed) return

    setLeaving(true)

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
        <a href={`/leagues/${type}`} style={{ color: '#f0b429' }}>← Back to League Hub</a>
      </main>
    )
  }

  const subPages = [
    { label: 'Leaderboard', emoji: '🏆', href: `/leagues/${type}/${instance}/leaderboard` },
    { label: 'Scoring Log', emoji: '🧮', href: `/leagues/${type}/scoring-log?from=${instance}` },
    { label: 'Analytics', emoji: '📈', href: `/leagues/${type}/${instance}/analytics` },
    { label: 'League Roster', emoji: '👥', href: `/leagues/${type}/${instance}/roster` },
    { label: 'Trade Portal', emoji: '🔄' },
    { label: 'League Chat', emoji: '💬' },
    { label: 'Draft Log', emoji: '📜', href: `/leagues/${type}/${instance}/draft-log` },
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

        <a href={`/leagues/${type}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to Politics on the Beach
        </a>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>

          <h1 style={{ color: '#f0b429', fontSize: '2.5rem', marginBottom: '0px' }}>
            {league.name}
          </h1>

          <p style={{ color: '#a0a0b0', fontSize: '.9rem', marginBottom: '48px' }}>
            {league.max_members
              ? `${memberCount ?? '...'} / ${league.max_members} members`
              : `${memberCount ?? '...'} members`}
          </p>

          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '12px'
            }}>
              {subPages.slice(0, 4).map((page) =>
                page.href
                  ? React.createElement(
                      'a',
                      {
                        key: page.label,
                        href: page.href,
                        className: 'subpage-link',
                        style: {
                          color: '#ffffff',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          textDecoration: 'none',
                          cursor: 'pointer'
                        }
                      },
                      page.emoji + ' ' + page.label
                    )
                  : React.createElement(
                      'span',
                      {
                        key: page.label,
                        className: 'subpage-link',
                        style: {
                          color: '#ffffff',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          cursor: 'default'
                        }
                      },
                      page.emoji + ' ' + page.label
                    )
              )}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {subPages.slice(4).map((page) =>
                page.href
                  ? React.createElement(
                      'a',
                      {
                        key: page.label,
                        href: page.href,
                        className: 'subpage-link',
                        style: {
                          color: '#ffffff',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          textDecoration: 'none',
                          cursor: 'pointer'
                        }
                      },
                      page.emoji + ' ' + page.label
                    )
                  : React.createElement(
                      'span',
                      {
                        key: page.label,
                        className: 'subpage-link',
                        style: {
                          color: '#ffffff',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          cursor: 'default'
                        }
                      },
                      page.emoji + ' ' + page.label
                    )
              )}
            </div>
          </div>

          <div style={{
            border: 'none',
            borderRadius: '10px',
            padding: '26px',
            maxWidth: '450px',
            margin: '0 auto'
          }}>
            {isMember ? (
              <div>
                <p style={{
                  color: '#f0b429',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                   whiteSpace: 'nowrap'
                }}>
                  You&apos;re in the league, {tierLabels[memberTier ?? ''] ?? memberTier}!
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <a href={`/leagues/${type}/${instance}/rankings`} className="btn" style={{
                    display: 'inline-block',
                    backgroundColor: 'transparent',
                    border: '1px solid #f0b429',
                    color: '#ffffff',
                    padding: '10px 22px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    Submit Draft Rankings →
                  </a>

                 <a href="/account" className="btn" style={{
  display: 'inline-block',
  backgroundColor: 'transparent',
  color: '#f0b429',
  border: '1px solid #f0b429',
  padding: '10px 22px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '0.9rem',
}}>
  {memberTier === 'teamprincipal' ? 'Manage Membership →' : 'Upgrade Membership →'}
</a>

                  <button
                    onClick={handleLeave}
                    disabled={leaving}
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'transparent',
                      color: '#ff6b6b',
                      border: '1px solid #ff6b6b',
                      padding: '10px 22px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      cursor: leaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {leaving ? 'Leaving...' : 'Leave League'}
                  </button>
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
      {`Continue as ${tierLabels[myTier] ?? myTier}`}
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
              <p style={{ color: '#f0b429', fontWeight: 'bold' }}>{joinMessage}</p>
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