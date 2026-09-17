'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Rat, Anchor, Drill, Rocket, Earth, Lock, TestTubeDiagonal, Hammer, CornerLeftUp } from 'lucide-react'

type MyLeague = {
  name: string
  type: string
  slug: string
  host_user_id?: string | null
  is_private?: boolean
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
  .select('name, league_type, slug, host_user_id, is_show_chat, is_private')
  .in('id', leagueIds)
      const realLeagues = (leagues ?? []).filter((l) => !l.is_show_chat)

      const mapped = realLeagues.map((l) => ({
  name: l.name,
  type: l.league_type,
  slug: l.slug,
  host_user_id: l.host_user_id,
  is_private: l.is_private,
}))

      setHostedLeagues(mapped.filter((l) => l.host_user_id === user.id))
      setJoinedLeagues(mapped.filter((l) => l.host_user_id !== user.id))
      setMyLeagueTypes(new Set(mapped.map((l) => l.type)))
      setLeaguesLoading(false)
    }
    if (!loading) {
      loadMyLeagues()
    }
  }, [user, loading])

  const hasRealLeagues = hostedLeagues.length > 0 || joinedLeagues.length > 0
  const showPersonalizedView = !loading && !leaguesLoading && user && hasRealLeagues

  const leagueTypeMeta: Record<string, string> = {
    'secrets-on-the-beach': 'secrets-on-the-beach',
    'uncharted-turretory': 'uncharted-turretory',
  }

  return (
<main style={{
  backgroundColor: '#0a0a0f',
  minHeight: '100vh',
  fontFamily: 'Georgia, serif',
  color: '#ffffff'
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
      fontSize: 'clamp(.75rem, 4vw, 0.85rem)',
      marginBottom: '0px',
      letterSpacing: '.9px'
    }}>
      Choose Fandoms. Draft Teams. Beat Buddies.
    </p>
  </div>

      {!showPersonalizedView && (
        <section style={{
          textAlign: 'center',
          padding: '60px 40px',
          background: 'linear-gradient(180deg, #12121a 0%, #0a0a0f 100%)'
        }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 8vw, 3rem)',
            color: '#ffffff',
            marginBottom: '14px',
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
  <section style={{ padding: '50px 40px 20px 40px' }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto', marginTop: '8px' }}>
<div className="league-circle-row" style={{
  display: 'flex',
  flexWrap: 'nowrap',
  justifyContent: 'center',
  gap: '16px',
  overflowX: 'auto',
  overflowY: 'visible',
  padding: '24px 12px',
}}>   {[...hostedLeagues, ...joinedLeagues].map((league) => {
          const isHosted = hostedLeagues.some((h) => h.slug === league.slug && h.type === league.type)
          return (
            <a
              key={`${league.type}-${league.slug}`}
              href={`/leagues/${league.type}/${league.slug}`}
              className="league-circle"
              style={{
                '--circle-color': isHosted ? '#ca29ca' : '#f0b429',
              } as React.CSSProperties}
            >
              <span className="league-circle-text">{league.name}</span>
            </a> 
          )   
        })}
   </div>
  <p style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: '#555570',
    fontSize: 'clamp(0.85rem, 3.5vw, 1rem)',
    textAlign: 'center',
    marginTop: '4.5px',
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
    Hot Route to Active Leagues
  </p> 
</div>
  </section>
)}

      {/* ─── LEAGUES ─── */}
<section id="leagues" className="scroll-offset" style={{ padding: '50px 40px' }}>
  <h2 style={{
    textAlign: 'center',
    color: '#f0b429',
    fontSize: 'clamp(1.75rem, 8vw, 2.25rem)',
    marginBottom: '16px',
    marginTop: '-36px',
    letterSpacing: '2px'
  }}> 
  Explore League Types
  </h2>

        <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '16px',
  maxWidth: '1100px',
  margin: '0 auto'
}}>

          {/* Secrets on the Beach */}
<div
  className="league-card"
  style={{
    backgroundColor: '#1a1a2e',
    border: '3px solid #f0b429',
    borderTop: '3px solid #f0b429',
    borderRadius: '12px',
    padding: '28px',
    flex: '0 1 350px'
  }}
>
  <h3 style={{ color: '#f0b429', fontSize: 'clamp(1.4rem, 6vw, 1.65rem)', marginBottom: '8px' }}>
    <span className="emoji-sotb">🏝️</span> Secrets on the Beach
  </h3>
  <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
    Set sail for this island adventure, going 25+ years strong, by drafting your tribe, winning challenges, and surviving the vote.
  </p>

  <button
    onClick={(e) => {
      e.stopPropagation()
      router.push('/leagues/secrets-on-the-beach/sotb-public')
    }}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'center',
      backgroundColor: '#f0b429',
      color: '#0a0a0f',
      padding: '10px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      cursor: 'pointer',
      marginBottom: '10px'
    }}
  >
    View Public League →
  </button>

  

  <button
  onClick={(e) => {
    e.stopPropagation()
    setShowPrivateLeaguesModal('secrets-on-the-beach')
  }}
  style={{
    display: 'block',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#f0b429',
    color: '#0a0a0f',
    padding: '10px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  My Private Leagues →
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
    display: 'block',
    width: '100%',
    textAlign: 'center',
    backgroundColor: 'transparent',
    color: '#f0b429',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #f0b429',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  Host Private League →
</button>

  <button
    onClick={(e) => {
      e.stopPropagation()
      router.push('/leagues/sotb-demo/sample-league')
    }}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'center',
      backgroundColor: 'transparent',
      color: '#a0a0b0',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #2a2a3e',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      cursor: 'pointer'
    }}
  >
    Explore Demo League →
  </button>
</div>

        {/* Uncharted Turretory */}
<div
  className="league-card"
  style={{
    backgroundColor: '#1a1a2e',
    border: '3px solid rgb(245, 255, 156)',
    borderTop: '3px solid rgb(245, 255, 156)',
    borderRadius: '12px',
    padding: '28px',
    flex: '0 1 350px'
  }}
>
  <h3 style={{ color: 'rgb(245, 255, 156)', fontSize: 'clamp(1.4rem, 6vw, 1.65rem)', marginBottom: '8px' }}>
    <span className="emoji-turret">🗡️</span> Uncharted Turretory
  </h3>
  <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
    Scale the turret steps of Alan's Castle and decide who you'll back in this game of murder, banishment, and deception.
  </p>

  <button
    onClick={(e) => {
      e.stopPropagation()
      router.push('/leagues/uncharted-turretory/uncharted-turretory-public')
    }}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'center',
      backgroundColor: 'rgb(245, 255, 156)',
      color: '#0a0a0f',
      padding: '10px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      cursor: 'pointer',
      marginBottom: '10px'
    }}
  >
    View Public League →
  </button>

  <button
  onClick={(e) => {
    e.stopPropagation()
    setShowPrivateLeaguesModal('uncharted-turretory')
  }}
  style={{
    display: 'block',
    width: '100%',
    textAlign: 'center',
    backgroundColor: 'rgb(245, 255, 156)',
    color: '#0a0a0f',
    padding: '10px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  My Private Leagues →
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
      display: 'block',
      width: '100%',
      textAlign: 'center',
      backgroundColor: 'transparent',
      color: 'rgb(245, 255, 156)',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid rgb(245, 255, 156)',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      cursor: 'pointer',
      marginBottom: '10px'
    }}
  >
    Host Private League →
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation()
      router.push('/leagues/uncharted-turretory-demo/sample-league-turret')
    }}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'center',
      backgroundColor: 'transparent',
      color: '#a0a0b0',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #2a2a3e',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      cursor: 'pointer'
    }}
  >
    Explore Demo League →
  </button>
</div>

<div style={{ flexBasis: '100%', height: 0 }}></div>

{/* Paddock Politicks */}
<div style={{
  backgroundColor: '#1a1a2e',
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
    gap: '6px'
  }}>
    <span className="emoji-f1-home">🏎️</span> <span className="text-f1-shift-home">Paddock Politicks</span>
  </h3>
  <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
    Coming in 2027, travel the globe with world-class drivers up and down the grid over 24 weeks of high octane racing.
  </p>

  <button onClick={() => setShowComingSoon(true)} style={{
    display: 'block', width: '100%', textAlign: 'center',
    backgroundColor: '#2a2a3e', color: '#a0a0b0', padding: '10px',
    borderRadius: '6px', border: '1px solid #3a3a5e', fontWeight: 'bold',
    fontSize: '0.9rem', cursor: 'pointer', marginBottom: '10px'
  }}>
    On Formation Lap →
  </button>
</div>

{/* The Oval Offset */}
<div style={{
  backgroundColor: '#1a1a2e',
  border: '3px solid rgb(245, 255, 156)',
  borderTop: '3px solid rgb(245, 255, 156)',
  borderRadius: '12px',
  padding: '28px',
  flex: '0 1 350px'
}}>
  <h3 style={{ color: 'rgb(245, 255, 156)', fontSize: 'clamp(1.4rem, 6vw, 1.7rem)', marginTop: '-5px', marginBottom: '8px' }}>
    <span className="emoji-drive">🚗</span> The Oval Offset
  </h3>
  <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
    Coming in 2027, climb through the cargo net for 36 weeks of American Thunder and race to the checkered flag.
  </p>

  <button onClick={() => setShowComingSoon(true)} style={{
    display: 'block', width: '100%', textAlign: 'center',
    backgroundColor: '#2a2a3e', color: '#a0a0b0', padding: '10px',
    borderRadius: '6px', border: '1px solid #3a3a5e', fontWeight: 'bold',
    fontSize: '0.9rem', cursor: 'pointer', marginBottom: '10px'
  }}>
    Stuck in Pit Lane →
  </button>

</div>

{/* Suggest a New League */}
 <div
  className="league-card"
  onClick={() => router.push('/contact')}
  style={{
    backgroundColor: '#1a1a2e',
    border: '3px solid #ffffff',
    borderTop: '3px solid #ffffff',
    borderRadius: '12px',
    padding: '28px',
    flex: '0 1 350px'
  }}
  >
            <h3 style={{ color: '#ffffff', fontSize: 'clamp(1.4rem, 6vw, 1.7rem)', marginBottom: '11px', marginTop: '0px' }}>
  <span className="emoji-suggest">💭</span> Suggest a Fandom
</h3>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '21.5px' }}>
Got an idea for a league we should build next? Send us your concept and help shape the future of Trekkon Fantasy Leagues. 
</p>
  <button
  onClick={(e) => {
    e.stopPropagation()
    router.push('/contact')
  }}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'center',
      backgroundColor: '#f0b429',
      color: '#0a0a0f',
      padding: '10px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      cursor: 'pointer'
    }}
  >
    Contact Our Team →
  </button>
</div>
</div>

      </section>


{/* ─── PRICING TIERS ─── */}
      <section id="tiers" style={{
        padding: '20px 40px',
        backgroundColor: '#0a0a0f',
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#f0b429',
          fontSize: 'clamp(1.75rem, 8vw, 2.25rem)',
          marginBottom: '0px',
          marginTop: '0px',
          letterSpacing: '2px'
        }}>
        Membership Tiers
        </h2>
       <p style={{
  textAlign: 'center',
  color: '#a0a0b0',
  marginBottom: '36px',
  fontSize: 'clamp(.85rem, 4.75vw, 1rem)',
}}>
  Prices shown <span style={{ fontWeight: 'bold' }}>per month</span> unless you opt for the yearlong All-Access Pass.
</p>

        <div className="home-tier-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
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
  margin: '40px auto 0 auto',
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
            padding: '24px',
            marginBottom: '48px',
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
        </div>
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

    </main>
  )
}