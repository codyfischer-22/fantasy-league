'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Rat, Anchor, Drill, Rocket, ScrollText, ClipboardList, Earth, Lock, TestTubeDiagonal, TreePalm, ChessRook } from 'lucide-react'

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
const [isMemberOfThisType, setIsMemberOfThisType] = useState(false)

useEffect(() => {
  async function checkMembership() {
    if (!user) {
      setIsMemberOfThisType(false)
      return
    }
    const { data: memberships } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', user.id)

    const leagueIds = (memberships ?? []).map((m) => m.league_id)
    if (leagueIds.length === 0) {
      setIsMemberOfThisType(false)
      return
    }

    const { count } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true })
      .eq('league_type', type)
      .eq('is_show_chat', false)
      .in('id', leagueIds)

    setIsMemberOfThisType((count ?? 0) > 0)
  }
  checkMembership()
}, [user, type])


const hubContent: Record<string, {
  title: string
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  intro: string[]
  demoHref?: string
  rulesDescription: string
  draftDescription: string
}> = {
  'secrets-on-the-beach': {
    title: 'Welcome to the Beach!',
    icon: TreePalm,
    intro: [
      'For 25 years, our screens and hearts have been graced with the iconic television series Survivor. This fantasy league emerged for Season 50, with its zany fan favorites, and continues today for a new generation of players in Fiji and on this platform.',
'Whether or not you\u2019ve played fantasy leagues before, please trust we\u2019ll guide you through this process. Draft tribes, make trades, watch episodes, stir up chatter, and then get off your couch to live your own adventure!',      
'To ensure your spot, register by September 15 (11:59 PM CT).',
      'Drafts window is September 16-20 (7:00 PM CT).',
      'Each tribe drafts 4 real-life castaways with the top 3 point-scorers counted toward season totals.',
      'Island politics are dangerous business! Can you survive?!',
    ],
      demoHref: '/leagues/sotb-demo/sample-league',
  rulesDescription: 'See the official points breakdown for challenges, idols, and tribal councils.',
  draftDescription: 'Study up on on draft windows, snake order, selection length, and trade rules.',
},
  'uncharted-turretory': {
    title: 'Welcome to the Turret!',
    icon: ChessRook,
    intro: [
      'Remember that game you used play at band camp? The one ehere someone is murdered every night and justice is doled out every morning? Multiply that by Fegan Floop from <em>Spy Kids</em>, and you have an Emmy-winning reality competition show, <em>The Traitors</em>.',
      'Whether or not you\u2019ve played fantasy leagues before, please trust we\u2019ll guide you through this process. Draft teams, make trades, watch episodes, stir up chatter, and then get off your couch to live your own adventure!',
      'To ensure your spot, register by September 15 (11:59 PM CT).',
      'Drafts window is September 16-17 (7:00 PM CT).',
      'Each player drafts 4 faithful or traitors with the top 3 point-scorers counted toward season totals.',
      'As it turns out, Nessy isn\u2019t the scariest thing in Scotland! Can you survive the castle?!',
    ],
  rulesDescription: 'See the official points breakdown for missions, shields, daggers, and round tables.',
  draftDescription: 'Study up on on draft windows, snake order, selection length, and trade rules.',
  demoHref: '/leagues/uncharted-turretory-demo/sample-league-turret',
},
}

if (!hubContent[type]) {
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
      <p>This league doesn&apos;t exist.</p>
      <a href="/" style={{ color: '#f0b429' }}>← Back to Trekkon Fantasy Leagues</a>
    </main>
  )
}

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
      Choose Fandoms. Draft Teams. Beat Buddies.
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

        <h1 style={{ color: '#f0b429', fontSize: 'clamp(2.0rem, 6vw, 3rem)', marginBottom: '24px', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
  {hubContent[type]?.icon && React.createElement(hubContent[type].icon, { size: 50, color: '#ffffff', strokeWidth: 1.2 })}
  {hubContent[type]?.title ?? 'Welcome!'}
</h1>

{!isMemberOfThisType && (
  <div style={{ textAlign: 'left', marginBottom: '48px', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
    <h2 className="mobile-center-heading" style={{ color: '#f0b429', fontSize: '1.4rem', textAlign: 'left', marginBottom: '4px' }}>
      Introduction
    </h2>
  {(hubContent[type]?.intro ?? []).map((paragraph, i) => (
    <p
      key={i}
      style={
        i === 2 || i === 3
          ? { color: '#f0b429', fontSize: '1.0rem', lineHeight: '1.2', textAlign: 'center', marginBottom: i === 3 ? '24px' : '16px' }
          : { color: '#a0a0b0', fontSize: '1.0rem', lineHeight: '1.2', marginBottom: i === (hubContent[type]?.intro.length ?? 1) - 1 ? '44px' : '24px' }
      }
      dangerouslySetInnerHTML={{ __html: paragraph }}
    />
  ))}
  </div>
)}

        {!isMemberOfThisType && (
  <h2 className="mobile-center-heading" style={{ color: '#f0b429', marginTop: '-8px', fontSize: '1.4rem', textAlign: 'left', marginBottom: '10px' }}>
    League Resources
  </h2>
)}

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
           <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <ScrollText size={28} strokeWidth={2} color="#ffffff" style={{ flexShrink: 0 }} /> Rules & Scoring <span className="demo-arrow">→</span>
</h2>
            <p style={{ color: '#a0a0b0', fontSize: '1rem', lineHeight: '1.5' }}>
  {hubContent[type]?.rulesDescription}
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
            <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <ClipboardList size={28} strokeWidth={2} color="#ffffff" style={{ flexShrink: 0 }} /> Draft & Trading <span className="demo-arrow">→</span>
</h2>
         <p style={{ color: '#a0a0b0', fontSize: '1rem', lineHeight: '1.5' }}>
  {hubContent[type]?.draftDescription}
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
            <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <Earth size={28} color="#ffffff" strokeWidth={2} style={{ flexShrink: 0 }} /> Public Leagues
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
         <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <Lock size={28} color="#ffffff" strokeWidth={2} style={{ flexShrink: 0, position: 'relative', top: '-2px' }} /> Private Leagues
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

       {hubContent[type]?.demoHref && (
  <a href={hubContent[type].demoHref} style={{
    display: 'block',
    backgroundColor: '#1a1a2e',
    border: '3px solid #f0b429',
    borderRadius: '12px',
    padding: '24px',
    textDecoration: 'none',
    color: '#ffffff',
    marginBottom: '36px'
  }}>
    <h2 style={{ color: '#f0b429', fontSize: 'clamp(1.1rem, 6.6vw, 1.7rem)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <TestTubeDiagonal size={28} color="#ffffff" strokeWidth={2} style={{ flexShrink: 0 }} /> Demo League <span className="demo-arrow">→</span>
    </h2>
    <p style={{ color: '#a0a0b0', fontSize: '1rem', lineHeight: '1.5' }}>
      See a &quot;real&quot; league in action to get a feel for how your league will look.
    </p>
  </a>
)}

   <h2 className="mobile-center-heading" style={{ color: '#f0b429', fontSize: '1.4rem', textAlign: 'left', marginBottom: '10px', marginTop: '24px' }}>
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
                <h3 style={{ fontSize: '1.2rem', color: '#a0a0b0', marginBottom: '8px' }}>Stowaway</h3>
            <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rat size={14} strokeWidth={2} /> 1 Public League</li>
  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rat size={14} strokeWidth={2} /> Private Access</li>
  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rat size={14} strokeWidth={2} /> Basic Leaderboards</li>
  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rat size={14} strokeWidth={2} /> Trade Portal Access</li>
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
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '8px' }}>Castaway</h3>
                <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Anchor size={14} strokeWidth={2} color="#ffffff" /> All Previous Perks</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Anchor size={14} strokeWidth={2} color="#ffffff" /> 3 Public Leagues</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Anchor size={14} strokeWidth={2} color="#ffffff" /> Public League Chat</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Anchor size={14} strokeWidth={2} color="#ffffff" /> Tracking Analytics</li>
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
                <h3 style={{ fontSize: '1.2rem', color: 'rgb(245, 255, 156)', marginBottom: '8px' }}>Crew Chief</h3>
                <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Drill size={14} strokeWidth={2} color="rgb(245, 255, 156)" /> All Previous Perks</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Drill size={14} strokeWidth={2} color="rgb(245, 255, 156)" /> Host Private League</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Drill size={14} strokeWidth={2} color="rgb(245, 255, 156)" /> 8-Player Capacity</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Drill size={14} strokeWidth={2} color="rgb(245, 255, 156)" /> Customize Settings</li>
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
                 <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rocket size={14} strokeWidth={2} color="#f0b429" /> All Previous Perks</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rocket size={14} strokeWidth={2} color="#f0b429" /> 3 18-Player Leagues</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rocket size={14} strokeWidth={2} color="#f0b429" /> Add Custom Scoring</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rocket size={14} strokeWidth={2} color="#f0b429" /> Highlighted Chats</li>
                  <div style={{ fontSize: '1.5rem', color: '#f0b429', fontWeight: 'bold', textAlign: 'center', marginBottom: '0px' }}>
                    $6.99
                  </div>
                </ul>
              </div>
            </div>
          </section>

          <p style={{ textAlign: 'center', color: '#555570', marginTop: '12px', fontSize: '1.0rem' }}>
            See &quot;Features&quot; for full membership and benefits breakdown.
          </p>
          </div>

    </main>
  )
}