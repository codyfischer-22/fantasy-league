'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

type League = {
  id: number
  name: string
  slug: string
  league_type: string
  is_private: boolean
}

export default function LeagueHubPage() {
  const params = useParams()
  const type = params.type as string
  const router = useRouter()
  const [instances, setInstances] = useState<League[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const { user } = useAuth()
  const [userTier, setUserTier] = useState<string | null>(null)
  const [myPrivateLeagues, setMyPrivateLeagues] = useState<League[]>([])

  useEffect(() => {
    const loadInstances = async () => {
      const { data } = await supabase
       .from('leagues')
  .select('*')
  .eq('league_type', type)
  .eq('is_private', false)
  .eq('is_show_chat', false)
      setInstances(data ?? [])
      setPageLoading(false)
    }
    loadInstances()
  }, [type])

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
    async function loadMyPrivateLeagues() {
      if (!user) {
        setMyPrivateLeagues([])
        return
      }
      const { data: memberships } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', user.id)

      const leagueIds = (memberships ?? []).map((m) => m.league_id)
      if (leagueIds.length === 0) {
        setMyPrivateLeagues([])
        return
      }

      const { data } = await supabase
        .from('leagues')
        .select('*')
        .eq('league_type', type)
        .eq('is_private', true)
        .in('id', leagueIds)

      setMyPrivateLeagues(data ?? [])
    }
    loadMyPrivateLeagues()
  }, [user, type])

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

     <div className="mobile-home-title" style={{
  display: 'none',
  textAlign: 'center',
  padding: '24px 20px 22px 20px',
  borderBottom: '2px solid #f0b429',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: '#0a0a0f',
  zIndex: 140
}}>
    <h1 style={{
      color: '#f0b429',
      fontSize: 'clamp(1rem, 5.9vw, 2.5rem)',
      margin: 0,
      letterSpacing: '1px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap'
    }}>
      ⚜️ Trekkon Fantasy Leagues
    </h1>
    <p style={{
      color: '#a0a0b0',
      margin: '4px 0 0 0',
      fontSize: 'clamp(.75rem, 3.5vw, 0.85rem)',
      marginBottom: '0px',
      letterSpacing: '.9px'
    }}>
      Gather Buddies. Draft Teams. Make History.
    </p>
  </div>

      <div className="mobile-page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/" style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to Trekkon Fantasy Leagues
        </a>

        <div style={{ textAlign: 'left', marginBottom: '48px', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h1 style={{ color: '#f0b429', fontSize: 'clamp(2.0rem, 6vw, 3rem)', marginBottom: '24px' }}>
  🏝️ Welcome to Politics on the Beach!
</h1>
          <h2 className="mobile-center-heading" style={{ color: '#f0b429', fontSize: '1.4rem', textAlign: 'left', marginBottom: '4px' }}>
            Introduction
          </h2>
          <p style={{ color: '#a0a0b0', fontSize: '1.1rem', lineHeight: '1.2', marginBottom: '24px' }}>
            For 25 years, our screens and hearts have been graced with the iconic television series Survivor. This fantasy league emerged for Season 50, with its zany fan favorites, and continues today for a new generation of players in Fiji and on this platform.
          </p>
          <p style={{ color: '#a0a0b0', fontSize: '1.1rem', lineHeight: '1.2', marginBottom: '24px' }}>
            Whether or not you&apos;ve played fantasy leagues before, please trust we&apos;ll guide you through this process. We encourage you to immerse yourself in the fun league spirit and community! Draft tribes, make trades, watch episodes, and then get off your couch and live your own adventure!
          </p>
          <p style={{ color: '#f0b429', fontSize: '1.2rem', lineHeight: '1.2', textAlign: 'center', marginBottom: '16px' }}>
            To ensure your spot in a league, register by Sept. 13 (11:59 PM CT).
          </p>
          <p style={{ color: '#f0b429', fontSize: '1.2rem', lineHeight: '1.2', textAlign: 'center', marginBottom: '24px' }}>
            Drafts will occur Sept. 16-20 (7:00 PM CT).
          </p>
          <p style={{ color: '#a0a0b0', fontSize: '1.1rem', lineHeight: '1.2', marginBottom: '24px' }}>
            Each tribe drafts 4 real-life castaways with the top 3 point-scorers counted toward season totals.
          </p>
          <p style={{ color: '#a0a0b0', fontSize: '1.1rem', lineHeight: '1.2', marginBottom: '44px' }}>
            Island politics are dangerous business! Can you survive?!
          </p>

          <h2 className="mobile-center-heading" style={{ color: '#f0b429', fontSize: '1.4rem', textAlign: 'left', marginBottom: '10px' }}>
            Membership Tiers
          </h2>

<section id="hub-tiers" style={{ backgroundColor: '#0a0a0f', marginBottom: '12px' }}>            <div className="tier-grid">
              <div
                className="tier-card"
                onClick={() => router.push('/account?tier=stowaway')}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '1.2rem', color: '#a0a0b0', marginBottom: '10px' }}>Stowaway</h3>
                <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
                  <li>⚓ 1 Public League</li>
                  <li>⚓ Private Access</li>
                  <li>⚓ Basic Leaderboards</li>
                  <li>⚓ Trade Portal Access</li>
                  <div style={{ fontSize: '1.5rem', color: '#a0a0b0', textAlign: 'center', fontWeight: 'bold', marginBottom: '0px' }}>
                    $0.00
                  </div>
                </ul>
              </div>

              <div
                className="tier-card"
                onClick={() => router.push('/account?tier=castaway')}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1.75px solid #ffffff',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '10px' }}>Castaway</h3>
                <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
                  <li>🥭 All Previous Perks</li>
                  <li>🥭 3 Public Leagues</li>
                  <li>🥭 Public League Chat</li>
                  <li>🥭 Tracking Analytics</li>
                  <div style={{ fontSize: '1.5rem', color: '#ffffff', textAlign: 'center', fontWeight: 'bold', marginBottom: '0px' }}>
                    $1.99
                  </div>
                </ul>
              </div>

              <div
                className="tier-card"
                onClick={() => router.push('/account?tier=crewchief')}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1.75px solid rgb(245, 255, 156)',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '1.2rem', color: 'rgb(245, 255, 156)', marginBottom: '10px' }}>Crew Chief</h3>
                <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
                  <li>🔧 All Previous Perks</li>
                  <li>🔧 Host Private League</li>
                  <li>🔧 8-Player Capacity</li>
                  <li>🔧 Customize Settings</li>
                  <div style={{ fontSize: '1.5rem', color: 'rgb(245, 255, 156)', fontWeight: 'bold', textAlign: 'center', marginBottom: '0px' }}>
                    $3.99
                  </div>
                </ul>
              </div>

              <div
                className="tier-card"
                onClick={() => router.push('/account?tier=teamprincipal')}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1.75px solid #e7ab1f',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <h3 style={{ fontSize: '1.2rem', color: '#f0b429', marginBottom: '10px' }}>
                  Team Principal
                </h3>
                <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
                  <li>🚀 All Previous Perks</li>
                  <li>🚀 3 18-Player Leagues</li>
                  <li>🚀 Add Custom Scoring</li>
                  <li>🚀 Highlighted Chats</li>
                  <div style={{ fontSize: '1.5rem', color: '#f0b429', fontWeight: 'bold', textAlign: 'center', marginBottom: '0px' }}>
                    $6.99
                  </div>
                </ul>
              </div>
            </div>
          </section>

          <p style={{ textAlign: 'center', color: '#555570', marginTop: '12px', fontSize: '1.0rem' }}>
            See &quot;Pricing&quot; tab for full membership and benefits breakdown.
          </p>
        </div>

        <h2 className="mobile-center-heading" style={{ color: '#f0b429', marginTop: '-8px', fontSize: '1.4rem', textAlign: 'left', marginBottom: '10px' }}>
          League Resources
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <a href={`/leagues/${type}/rules`} style={{
            backgroundColor: '#1a1a2e',
            border: '3px solid #f0b429',
            borderRadius: '12px',
            padding: '24px',
            textDecoration: 'none',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '8px' }}>
              📜 Rules & Scoring <span className="demo-arrow">→</span>
            </h2>
            <p style={{ color: '#a0a0b0', fontSize: '1rem', lineHeight: '1.5' }}>
              See the official point breakdown for challenges, idols, tribal councils, and the end game.
            </p>
          </a>

          <a href={`/leagues/${type}/draft`} style={{
            backgroundColor: '#1a1a2e',
            border: '3px solid #f0b429',
            borderRadius: '12px',
            padding: '24px',
            textDecoration: 'none',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '8px' }}>
              📋 Draft & Trading <span className="demo-arrow">→</span>
            </h2>
            <p style={{ color: '#a0a0b0', fontSize: '1rem', lineHeight: '1.5' }}>
              Study up on on draft windows, snake order, selection length, and trade rules.
            </p>
          </a>

          <div style={{
            backgroundColor: '#1a1a2e',
            border: '3px solid #f0b429',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '10px' }}>
              🌍 Public Leagues
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {instances.length === 0 ? (
                <p style={{ color: '#555570', fontSize: '0.9rem' }}>No public leagues available yet.</p>
              ) : (
                instances.map(function (instance) {
                  return React.createElement(
                    'a',
                    {
                      key: instance.id,
                      href: '/leagues/' + type + '/' + instance.slug,
                      className: 'league-card',
                      style: {
                        backgroundColor: '#12121a',
                        borderRadius: '8px',
                        padding: '14px 18px',
                        textDecoration: 'none',
                        color: '#ffffff',
                        fontSize: '0.95rem',
                        display: 'block'
                      }
                    },
                    instance.name + ' ',
                    React.createElement('span', { className: 'demo-arrow' }, '→')
                  )
                })
              )}
            </div>
          </div>

          <div style={{
            backgroundColor: '#1a1a2e',
            border: '3px solid #f0b429',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '8px' }}>
              🔒 Private Leagues
            </h2>

            {userTier === 'crewchief' || userTier === 'teamprincipal' ? (
              <a href={`/leagues/${type}/create`} className="league-card" style={{
                display: 'block',
                backgroundColor: '#f0b429',
                borderRadius: '8px',
                padding: '14px 18px',
                textDecoration: 'none',
                color: '#12121a',
                fontWeight: 'bold',
                fontSize: '1rem',
                textAlign: 'left'
              }}>
                Create Private League<span className="demo-arrow">→</span>
              </a>
            ) : (
              <a href="/account" className="league-card" style={{
                display: 'block',
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                padding: '14px 18px',
                textDecoration: 'none',
                color: '#555570',
                fontWeight: 'bold',
                fontSize: '1rem',
                textAlign: 'left'
              }}>
                Must Be Crew Chief+ to Host <span className="demo-arrow">→</span>
              </a>
            )}

            {myPrivateLeagues.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {myPrivateLeagues.map((league) => (
                  <a
                    key={league.id}
                    href={`/leagues/${type}/${league.slug}`}
                    className="league-card"
                    style={{
                      backgroundColor: '#12121a',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      textDecoration: 'none',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      display: 'block'
                    }}
                  >
                    {league.name} <span className="demo-arrow">→</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <a href="/leagues/potb-demo/sample-league" style={{
          display: 'block',
          backgroundColor: '#1a1a2e',
          border: '3px solid #f0b429',
          borderRadius: '12px',
          padding: '24px',
          textDecoration: 'none',
          color: '#ffffff',
          marginBottom: '0px'
        }}>
          <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '8px' }}>
            🎪 Demo League <span className="demo-arrow">→</span>
          </h2>
          <p style={{ color: '#a0a0b0', fontSize: '1rem', lineHeight: '1.5' }}>
            See a &quot;real&quot; league in action to get a feel for how your league will look.
          </p>
        </a>
      </div>
    </main>
  )
}