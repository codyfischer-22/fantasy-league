'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

type JoinedLeague = {
  name: string
  type: string
  slug: string
  host_user_id?: string | null
}

export default function LeaguesOverviewPage() {
  const { user, loading } = useAuth()
  const [hostedLeagues, setHostedLeagues] = useState<JoinedLeague[]>([])
  const [joinedLeagues, setJoinedLeagues] = useState<JoinedLeague[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [userTier, setUserTier] = useState<string | null>(null)
  const leagueTypes = [
  { name: 'Politics on the Beach', slug: 'politics-on-the-beach', emoji: '🏝️', color: '#f0b429', comingSoon: false },
  { name: "'Muricans Turn Left", slug: 'americans-turning-left', emoji: '🚗', color: 'rgb(245, 255, 156)', comingSoon: true },
  { name: 'European Rockets', slug: 'european-rocket-ships', emoji: '🏎️', color: '#f0b429', comingSoon: true },
  ]

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
  async function loadJoinedLeagues() {
    if (!user) {
      setPageLoading(false)
      return
    }
    const { data: memberships } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', user.id)

    if (memberships && memberships.length > 0) {
      const leagueIds = memberships.map((m) => m.league_id)
      const { data: leagues } = await supabase
        .from('leagues')
        .select('name, league_type, slug, host_user_id')
        .in('id', leagueIds)

      const allLeagues = (leagues ?? []).map((l) => ({
        name: l.name,
        type: l.league_type,
        slug: l.slug,
        host_user_id: l.host_user_id,
      }))

      setHostedLeagues(allLeagues.filter((l) => l.host_user_id === user.id))
      setJoinedLeagues(allLeagues.filter((l) => l.host_user_id !== user.id))
    }
    setPageLoading(false)
  }
  if (!loading) {
    loadJoinedLeagues()
  }
}, [user, loading])

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

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '60px 40px'
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        <h1 style={{ color: '#f0b429', fontSize: '2.25rem', marginBottom: '32px' }}>
          🏆 Trekkon Fantasy Leagues
        </h1>

<div className="leagues-grid">

  {/* TOP LEFT — Types of Leagues */}
  <div>
    <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '8px' }}>
      Types of Leagues
    </h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {leagueTypes.map((lt) =>
        lt.comingSoon ? (
          <button
            key={lt.slug}
            onClick={() => setShowComingSoon(true)}
            style={{
              backgroundColor: '#1a1a2e',
              border: `1px solid ${lt.color}`,
              borderRadius: '10px',
              padding: '16px 22px',
              textAlign: 'left',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            {lt.emoji} {lt.name} →
          </button>
        ) : (
          <a
            key={lt.slug}
            href={`/leagues/${lt.slug}`}
            className="btn"
            style={{
              backgroundColor: '#1a1a2e',
              border: `1px solid ${lt.color}`,
              borderRadius: '10px',
              padding: '16px 22px',
              textDecoration: 'none',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '0.95rem'
            }}
          >
            {lt.emoji} {lt.name} →
          </a>
        )
      )}
    </div>
  </div>

  {/* TOP RIGHT — Leagues You Host (Crew Chief+) or Your Leagues (everyone else) */}
<div>
  {user && (userTier === 'crewchief' || userTier === 'teamprincipal') ? (
    <>
      <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '8px' }}>
        Leagues You Host
      </h2>
      {hostedLeagues.length === 0 ? (
        <p style={{ color: '#555570' }}>
          You&apos;re not hosting any leagues yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {hostedLeagues.map((league) => (
            <a
              key={league.slug}
              href={`/leagues/${league.type}/${league.slug}`}
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #f0b429',
                borderRadius: '10px',
                padding: '16px 22px',
                textDecoration: 'none',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.95rem'
              }}
            >
              {league.name} →
            </a>
          ))}
        </div>
      )}
    </>
  ) : user ? (
    <>
      <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '8px' }}>
        Your Leagues
      </h2>
      {joinedLeagues.length === 0 ? (
        <p style={{ color: '#555570' }}>
          You haven&apos;t joined any leagues yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {joinedLeagues.map((league) => (
            <a
              key={league.slug}
              href={`/leagues/${league.type}/${league.slug}`}
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #f0b429',
                borderRadius: '10px',
                padding: '16px 22px',
                textDecoration: 'none',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.95rem'
              }}
            >
              {league.name} →
            </a>
          ))}
        </div>
      )}
    </>
  ) : null}
</div>


  {/* BOTTOM LEFT — Demo League */}
  <div>
    <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '8px' }}>
      View a Demo League
    </h2>
    <div className="btn" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <a
  href="/leagues/potb-demo/sample-league"
  style={{
    backgroundColor: '#1a1a2e',
    border: '1px solid #f0b429',
    borderRadius: '10px',
    padding: '16px 22px',
    textDecoration: 'none',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '0.95rem'
  }}
>
  <div>🎪 Politics on the Beach Demo →</div>
  <div style={{ color: '#555570', fontWeight: 'normal', fontSize: '0.8rem', marginTop: '0px' }}>
    Can you guess what season this represents?!
  </div>
</a>
    </div>
  </div>

{/* BOTTOM RIGHT — Your Leagues (shown here for Crew Chief+ hosts, since "Leagues You Host" already occupies the top-right slot for them) */}
<div>
  {user && (userTier === 'crewchief' || userTier === 'teamprincipal') && (
    <>
      <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '8px' }}>
        Your Leagues
      </h2>
      {joinedLeagues.length === 0 ? (
        <p style={{ color: '#555570' }}>
          You haven&apos;t joined any leagues yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {joinedLeagues.map((league) => (
            <a
              key={league.slug}
              href={`/leagues/${league.type}/${league.slug}`}
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #f0b429',
                borderRadius: '10px',
                padding: '16px 22px',
                textDecoration: 'none',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.95rem'
              }}
            >
              {league.name} →
            </a>
          ))}
        </div>
      )}
    </>
  )}
</div>


</div>

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
      padding: '32px',
      maxWidth: '380px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏁</div>
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

      </div>
    </main>
  )
}