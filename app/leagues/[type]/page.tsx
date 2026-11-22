'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { backgroundsByType } from '@/lib/leagueConfig'
import {
  Rat, Anchor, Drill, Rocket, ScrollText, ClipboardList, TestTubeDiagonal, TreePalm, ChessRook,
  Trophy, Dices, RefreshCw, Calculator, TrendingUp, ArrowUpDown, Lock, ChevronLeft, ChevronRight,
} from 'lucide-react'

type League = {
  id: number
  name: string
  slug: string
  is_private: boolean
}

// YouTube playlist per fandom (same IDs as the league home dashboard)
const podcastPlaylistByType: Record<string, string> = {
  'secrets-on-the-beach': 'PLH2t1c28BV7s',
  'uncharted-turretory': 'PLLQ_n7kjZ1iM',
}

const hubContent: Record<string, {
  name: string
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  intro: string[]
  keyDates: string[]
  closer: string
  demoHref: string
  tagline: string
}> = {
  'secrets-on-the-beach': {
    name: 'Secrets on the Beach',
    tagline: 'Unofficial "Survivor" League',
    icon: TreePalm,
    intro: [
      'For 25 years, our screens and hearts have been graced with the iconic television series <em>Survivor</em>. This fantasy league emerged for Season 50, with its zany fan favorites, and continues today for a new generation of castaways in Fiji and players on this platform.',
      'Whether or not you’ve played fantasy leagues before, please trust we’ll guide you through this process. Draft tribes, make trades, watch episodes, and then get off your couch to live your own adventure!',
      'Each tribe drafts 4 real-life castaways, with the top 3 point-scorers counted toward season totals.',
    ],
    keyDates: [
      'Register by September 15 (11:59 PM CT)',
      'Draft window: September 16–20 (7:00 PM CT)',
    ],
    closer: 'Island politics are dangerous business! Can you survive?!',
    demoHref: '/leagues/sotb-demo/sample-league',
  },
  'uncharted-turretory': {
    name: 'Uncharted Turretory',
    tagline: 'Unofficial "The Traitors" League',
    icon: ChessRook,
    intro: [
      'Remember that game you used to play at band camp? The one where someone is murdered every night and justice is doled out every morning? Multiply that by Fegan Floop from <em>Spy Kids</em>, and you have an Emmy-winning reality competition show, <em>The Traitors</em>.',
      'Whether or not you’ve played fantasy leagues before, please trust we’ll guide you through this process. Draft teams, make trades, watch episodes, and then get off your couch to live your own adventure!',
      'Each player drafts 4 castle-goers, with the top 3 point-scorers counted toward season totals.',
    ],
    keyDates: [
      'Register by September 15 (11:59 PM CT)',
      'Draft window: September 16–17 (7:00 PM CT)',
    ],
    closer: 'As it turns out, Nessie isn’t the scariest thing in Scotland! Can you survive the castle?!',
    demoHref: '/leagues/uncharted-turretory-demo/sample-league',
  },
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

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  border: '1px solid #2a2a3e',
  borderRadius: '10px',
  padding: '18px 20px',
  minWidth: 0,
}

const kickerStyle: React.CSSProperties = {
  color: '#f0b429',
  fontSize: '0.72rem',
  fontWeight: 'bold',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  margin: '0 0 12px 0',
}

const leagueRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#12121a',
  border: '1px solid #2a2a3e',
  borderRadius: '8px',
  padding: '10px 14px',
  textDecoration: 'none',
  color: '#ffffff',
  fontSize: '0.9rem',
}

export default function FandomHubPage() {
  const params = useParams()
  const type = params.type as string
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const content = hubContent[type]
  const playlistId = podcastPlaylistByType[type] ?? ''

  const [pageLoading, setPageLoading] = useState(true)
  const [publicLeagues, setPublicLeagues] = useState<League[]>([])
  const [myLeagues, setMyLeagues] = useState<League[]>([])
  const [userTier, setUserTier] = useState<string | null>(null)
  const [isMobileWidth, setIsMobileWidth] = useState(false)
  const [toolsAtStart, setToolsAtStart] = useState(true)
  const [toolsAtEnd, setToolsAtEnd] = useState(false)
  const toolRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobileWidth(window.innerWidth <= 600)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function load() {
      if (authLoading || !content) return

      const { data: publicRows } = await supabase
        .from('leagues')
        .select('id, name, slug, is_private')
        .eq('league_type', type)
        .eq('is_private', false)
        .eq('is_show_chat', false)
        .eq('is_archived', false)
        .order('name')
      setPublicLeagues(publicRows ?? [])

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('user_id', user.id)
          .single()
        setUserTier(profile?.tier ?? 'stowaway')

        const { data: memberships } = await supabase
          .from('league_members')
          .select('league_id')
          .eq('user_id', user.id)
        const ids = (memberships ?? []).map((m) => m.league_id)
        if (ids.length > 0) {
          const { data: mine } = await supabase
            .from('leagues')
            .select('id, name, slug, is_private')
            .eq('league_type', type)
            .eq('is_show_chat', false)
            .eq('is_archived', false)
            .in('id', ids)
            .order('name')
          setMyLeagues(mine ?? [])
        }
      }

      setPageLoading(false)
    }
    load()
  }, [type, user, authLoading, content])

  const mainStyle: React.CSSProperties = {
    backgroundColor: '#0a0a0f',
    minHeight: '100vh',
    fontFamily: 'Georgia, serif',
    color: '#ffffff',
    padding: '60px 40px',
    ...(backgroundsByType[type] && {
      backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.6), rgba(10, 10, 15, 0.70)), url(${backgroundsByType[type]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }),
  }

  if (!content) {
    return (
      <main className="mobile-shrink-main" style={{ ...mainStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#a0a0b0' }}>
        <p>This fandom doesn&apos;t exist.</p>
        <a href="/" style={{ color: '#f0b429' }}>← Back to Trekkon Fantasy Leagues</a>
      </main>
    )
  }

  if (authLoading || pageLoading) {
    return <main className="mobile-shrink-main" style={mainStyle}>Loading...</main>
  }

  const canHost = userTier === 'crewchief' || userTier === 'teamprincipal'
  const inAnyLeague = myLeagues.length > 0
  const FandomIcon = content.icon

  // Tray: fandom-wide pages are live; league-only tools are shown but locked
  const tools: { label: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; href: string | null }[] = [
    { label: 'Rules', icon: ScrollText, href: `/leagues/${type}/rules` },
    { label: 'Rosters', icon: ClipboardList, href: `/leagues/${type}/draft` },
    { label: 'Demo League', icon: TestTubeDiagonal, href: content.demoHref },
    { label: 'Pre-Rank', icon: ArrowUpDown, href: null },
    { label: 'Leaderboard', icon: Trophy, href: null },
    { label: 'Predictions', icon: Dices, href: null },
    { label: 'Trade Portal', icon: RefreshCw, href: null },
    { label: 'Scoring Log', icon: Calculator, href: null },
    { label: 'Analytics', icon: TrendingUp, href: null },
  ]

  return (
    <main className="mobile-shrink-main" style={mainStyle}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Back to Trekkon Fantasy Leagues
        </a>

        {/* ─── HEADER ─── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', margin: 0, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '10px', color: '#f0b429' }}>
              <FandomIcon size={34} color="#ffffff" strokeWidth={1.5} />
              {content.name}
            </h1>
                        <p style={{ color: '#a0a0b0', fontSize: '1.1rem', margin: 0 }}>
              {content.tagline}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {publicLeagues.length > 0 && !myLeagues.some((m) => !m.is_private) && (
              publicLeagues.length === 1 ? (
                <a href={`/leagues/${type}/${publicLeagues[0].slug}`} style={pillButton('#2bda25')}>
                  Join Public League
                </a>
              ) : (
                <a href="#find-a-league" style={pillButton('#2bda25')}>
                  Join a Public League
                </a>
              )
            )}
            {user && (
              <a href={canHost ? `/leagues/${type}/create` : '/account'} style={pillButton(canHost ? '#f0b429' : '#a0a0b0')}>
                {canHost ? 'Host a League' : 'Crew Chief+ to Host'}
              </a>
            )}
          </div>
        </div>

        {/* ─── TOOL TRAY ─── */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <div
            ref={toolRowRef}
            className="tool-grid tool-scroll"
            onScroll={(e) => {
              const el = e.currentTarget
              setToolsAtStart(el.scrollLeft <= 4)
              setToolsAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
            }}
            style={{
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
            {tools.map((tool) => {
              const Icon = tool.icon
              const locked = !tool.href
              const tileStyle: React.CSSProperties = {
                position: 'relative',
                textAlign: 'center',
                textDecoration: 'none',
                color: locked ? '#a0a0b0' : '#ffffff',
                flex: isMobileWidth ? '0 0 21%' : '1 0 72px',
                minWidth: 0,
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.35 : 1,
              }
                 const inner = (
                <>
                  <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                    <Icon size={isMobileWidth ? 26 : 34} strokeWidth={1.5} color={locked ? '#a0a0b0' : '#f5ff9c'} />
                  </div>
                  <div style={{ fontSize: isMobileWidth ? '0.65rem' : '0.8rem', lineHeight: 1.2 }}>{tool.label}</div>
                </>
              )
              return locked ? (
                <div key={tool.label} title="Join or host a league to unlock" style={tileStyle}>{inner}</div>
              ) : (
                <Link key={tool.label} href={tool.href!} className="subpage-card" style={tileStyle}>{inner}</Link>
              )
            })}
          </div>

          {isMobileWidth && !toolsAtStart && (
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', background: 'linear-gradient(to left, transparent, rgba(10, 10, 15, 0.9))', pointerEvents: 'none' }}>
              <ChevronLeft size={22} color="#f0b429" strokeWidth={2.5} className="draft-room-emoji" />
            </div>
          )}
          {isMobileWidth && !toolsAtEnd && (
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: 'linear-gradient(to right, transparent, rgba(10, 10, 15, 0.9))', pointerEvents: 'none' }}>
              <ChevronRight size={22} color="#f0b429" strokeWidth={2.5} className="draft-room-emoji" />
            </div>
          )}
        </div>
              <p style={{ color: '#a0a0b0', fontSize: '0.8rem', opacity: '.55', textAlign: 'center', margin: '10px 0 32px 0' }}>
          <Lock size={12} color="#a0a0b0" strokeWidth={2.5} style={{ display: 'inline-block', verticalAlign: '-1px', opacity: '.55', marginRight: '4px' }} />
          To see grayed-out tools in action, join a league or check out demo!
        </p>

        {/* ─── CONTENT ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobileWidth ? '1fr' : '35fr 65fr', gap: '16px' }}>

          {/* Leagues */}
          <div id="find-a-league" style={{ ...cardStyle, padding: '14px 16px', scrollMarginTop: '100px' }}>
            <p style={kickerStyle}>{inAnyLeague ? 'Your Leagues' : 'Find a League'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inAnyLeague && myLeagues.map((l) => (
                <a key={l.id} href={`/leagues/${type}/${l.slug}`} style={leagueRowStyle}>
                  <span>{l.name}</span>
                  <span style={{ color: '#f0b429' }}>→</span>
                </a>
              ))}

              {publicLeagues.filter((p) => !myLeagues.some((m) => m.id === p.id)).length > 0 && (
                <>
                  <div style={{ color: '#a0a0b0', fontSize: '0.75rem', marginTop: inAnyLeague ? '8px' : 0 }}>Public</div>
                  {publicLeagues
                    .filter((p) => !myLeagues.some((m) => m.id === p.id))
                    .map((l) => (
                      <a key={l.id} href={`/leagues/${type}/${l.slug}`} style={leagueRowStyle}>
                        <span>{l.name}</span>
                        <span style={{ color: '#2bda25', fontSize: '0.8rem', fontWeight: 'bold' }}>Join →</span>
                      </a>
                    ))}
                </>
              )}

              <div style={{ color: '#a0a0b0', fontSize: '0.75rem', marginTop: '8px' }}>Private</div>
              <p style={{ color: '#555570', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                Private leagues are invite-only. Ask your host for their custom link or{' '}
                {canHost ? (
                  <a href={`/leagues/${type}/create`} style={{ color: '#f0b429', textDecoration: 'underline' }}>host your own</a>
                ) : (
                  <a href="/account" style={{ color: '#f0b429', textDecoration: 'underline' }}>upgrade to host your own</a>
                )}.
              </p>
            </div>
          </div>

          {/* Podcast */}
          {playlistId ? (
            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '16 / 9', alignSelf: 'start' }}>
              <iframe
                src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
                title="Talkin' with Trekkon"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          ) : <div />}

          {/* About (full width) */}
          <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <p style={kickerStyle}>About the Fandom</p>
            {content.intro.map((paragraph, i) => (
              <p
                key={i}
                style={{ color: i === 0 ? '#ffffff' : '#a0a0b0', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 12px 0' }}
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            ))}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '4px 0 12px 0' }}>
              {content.keyDates.map((d) => (
                <span key={d} style={{ backgroundColor: 'rgba(240, 180, 41, 0.12)', border: '1px solid #f0b429', color: '#f0b429', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {d}
                </span>
              ))}
            </div>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', fontStyle: 'italic', margin: 0 }}>{content.closer}</p>
          </div>

          {/* Membership tiers (full width, compact) */}
          <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <p style={kickerStyle}>Membership Tiers</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobileWidth ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { key: 'stowaway', name: 'Stowaway', price: '$0.00', color: '#a0a0b0', Icon: Rat, perks: ['1 Public League', 'Private Access', 'Basic Leaderboards', 'Trade Portal'] },
                { key: 'castaway', name: 'Castaway', price: '$1.99', color: '#ffffff', Icon: Anchor, perks: ['All Previous Perks', '3 Public Leagues', 'Public League Chat', 'Tracking Analytics'] },
                { key: 'crewchief', name: 'Crew Chief', price: '$3.99', color: 'rgb(245, 255, 156)', Icon: Drill, perks: ['All Previous Perks', 'Host Private League', '8-Player Capacity', 'Custom Settings'] },
                { key: 'teamprincipal', name: 'Team Principal', price: '$6.99', color: '#f0b429', Icon: Rocket, perks: ['All Previous Perks', '3 18-Player Leagues', 'Custom Scoring', 'Highlighted Chats'] },
              ].map((t) => (
                <div
                  key={t.key}
                  className="tier-card"
                  onClick={() => router.push(`/account?tier=${t.key}`)}
                  style={{ backgroundColor: '#12121a', border: `1px solid ${t.key === 'stowaway' ? '#2a2a3e' : t.color}`, borderRadius: '8px', padding: '12px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                                        <span style={{ color: t.color, fontWeight: 'bold', fontSize: '0.9rem' }}>{isMobileWidth && t.key === 'teamprincipal' ? 'Principal' : t.name}</span>
                    <span style={{ color: t.color, fontWeight: 'bold', fontSize: '0.85rem' }}>{t.price}</span>
                  </div>
                  {t.perks.map((p) => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a0b0', fontSize: '0.75rem', lineHeight: 1.7 }}>
                      <t.Icon size={12} strokeWidth={2} color={t.color} /> {p}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p style={{ color: '#555570', fontSize: '0.8rem', textAlign: 'center', margin: '12px 0 0 0' }}>
              Prices per month. Tap a tier for the full breakdown.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}