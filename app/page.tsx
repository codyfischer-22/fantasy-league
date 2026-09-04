'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Rat, Anchor, Drill, Rocket, Wallet, Hourglass } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showComingSoon, setShowComingSoon] = useState(false)

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
      Gather Buddies. Draft Teams. Make History.
    </p>
  </div>
  

      {/* ─── HERO ─── */}
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
          Fantasy without the Pigskin, <span style={{ color: '#f0b429' }}>Finally</span>
        </h2>
<p className="hero-text" style={{
  color: '#a0a0b0',
  fontSize: 'clamp(.85rem, 4.5vw, 1.2rem)',
  maxWidth: '600px',
  margin: '0 auto 16px auto',
  lineHeight: '1.7'
}}>
  Move over, Football! Here comes a new wave of fantasy leagues for the cutthroat, the speed junkies, and the adventurous at heart.
</p>
<p className="hero-text" style={{
  color: '#a0a0b0',
  fontSize: 'clamp(.85rem, 4.5vw, 1.2rem)',
  maxWidth: '800px',
  margin: '0 auto 32px auto',
  lineHeight: '1.7'
}}>
  <span style={{ fontStyle: 'italic' }}>Trekkon</span> is derived from the Ancient Greek <span style={{ fontStyle: 'italic' }}>"τρέχω,"</span> to race or run, and <span style={{ fontStyle: 'italic' }}>"ἀγών,"</span> a gathering place for games, competitions, or battles.
We inspire players to cheer on and team up with their favorite on-screen personas in the hopes they&apos;ll trek out and conquer battles of their own.
</p>
        <a href="#leagues" className="btn" style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '14px 32px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '1rem',
          letterSpacing: '1.2px'
        }}>
          Browse Leagues →
        </a>
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
  Prices shown <span style={{ fontWeight: 'bold' }}>per month</span> unless you opt for the yearlong pass (coming soon) good for all leagues.
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
              <li>❌ No Public Chat</li>
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

    {/* ─── LEAGUES ─── */}
<section id="leagues" className="scroll-offset" style={{ padding: '50px 40px' }}>
  <h2 style={{
    textAlign: 'center',
    color: '#f0b429',
    fontSize: 'clamp(1.75rem, 8vw, 2.25rem)',
    marginBottom: '16px',
    letterSpacing: '2px'
  }}>
  Choose Your League
  </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          maxWidth: '1100px',
          margin: '0 auto'
        }}>

          {/* Politics on the Beach */}
<div
  className="league-card"
  onClick={() => router.push('/leagues/politics-on-the-beach')}
  style={{
    backgroundColor: '#1a1a2e',
    border: '3px solid #f0b429',
    borderTop: '3px solid #f0b429',
    borderRadius: '12px',
    padding: '28px'
  }}
>
  <h3 style={{ color: '#f0b429', fontSize: 'clamp(1.35rem, 6vw, 1.6rem)', marginBottom: '8px' }}>
    🏝️ Politics on the Beach
  </h3>
  <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px' }}>
    Set sail for this island adventure, going 25+ years strong, by drafting your tribe, winning challenges, and surviving the vote.
  </p>
 <div style={{
  backgroundColor: '#12121a',
  borderRadius: '6px',
  padding: '10px 14px',
  marginBottom: '16px',
  fontSize: '0.8rem',
  color: '#a0a0b0',
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
}}>
  <Wallet size={18} strokeWidth={2} /> From <span style={{ color: '#f0b429', fontWeight: 'bold' }}>$0.00</span> / Season
</div>
 <button
  onClick={(e) => {
    e.stopPropagation()
    router.push('/leagues/politics-on-the-beach')
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
    Climb Aboard →
  </button>
</div>

          {/* Americans Turning Left */}
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '3px solid rgb(245, 255, 156)',
            borderTop: '3px solid rgb(245, 255, 156)',
            borderRadius: '12px',
            padding: '28px'
          }}>
            <h3 style={{ color: 'rgb(245, 255, 156)', fontSize: 'clamp(1.35rem, 6vw, 1.6rem)', marginBottom: '8px' }}>
              🚗 Drive Fast, Turn Left
            </h3>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Coming in 2027, climb through the cargo net for 36 weeks of American Muscle, seeing how many points you can bring to the checkered.
            </p>
          <div style={{
  backgroundColor: '#12121a',
  borderRadius: '6px',
  padding: '10px 14px',
  marginBottom: '16px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  color: '#a0a0b0',
  display: 'flex',
  alignItems: 'center',
  gap: '7px'
}}>
  <Hourglass size={16} strokeWidth={2} /> <span style={{ color: '#a0a0b0', fontWeight: 'bold' }}>Coming Soon!</span>
</div>
            <button
  onClick={() => setShowComingSoon(true)}
  style={{
    display: 'block',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#2a2a3e',
    color: '#a0a0b0',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #3a3a5e',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }}
>
  Start Your Engines →
</button>
          </div>

          {/* European Rocket Ships */}
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '3px solid #f0b429',
            borderTop: '3px solid #f0b429',
            borderRadius: '12px',
            padding: '28px'
          }}>
            <h3 style={{ color: '#f0b429', fontSize: 'clamp(1.35rem, 6vw, 1.6rem)', marginBottom: '8px' }}>
             🏎️ Road Rocket Racing
            </h3>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Coming in 2027, travel the globe with world-class drivers up and down the grid over 24 weeks of high octane racing.
            </p>
            <div style={{
  backgroundColor: '#12121a',
  borderRadius: '6px',
  padding: '10px 14px',
  marginBottom: '16px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  color: '#a0a0b0',
  display: 'flex',
  alignItems: 'center',
  gap: '7px'
}}>
  <Hourglass size={16} strokeWidth={2} /> <span style={{ color: '#a0a0b0', fontWeight: 'bold' }}>Coming Soon!</span>
</div>
            <button
  onClick={() => setShowComingSoon(true)}
  style={{
    display: 'block',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#2a2a3e',
    color: '#a0a0b0',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #3a3a5e',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }}
>
  Red Lights Out →
</button>
          </div>
        </div>
      </section>

      {/* ─── SUGGEST A LEAGUE ─── */}
      <section id="suggest" style={{
        padding: '20px 40px',
        textAlign: 'center',
        backgroundColor: '#0a0a0f',
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#f0b429',
          fontSize: 'clamp(1.5rem, 6vw, 2.25rem)',
          marginBottom: '0px',
          letterSpacing: '2px'
        }}>
        Suggest a New League
        </h2>
        <p className="hero-text" style={{
          color: '#a0a0b0',
          fontSize: '1.0rem',
          maxWidth: '500px',
          margin: '0 auto 28px auto',
          lineHeight: '1.7'
        }}>
          Got an idea for a fantasy league we should build next? Send us your concept and help shape
          the future of Trekkon Fantasy Leagues.
        </p>
        <a href="/contact" className="btn" style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '14px 32px',
          borderRadius: '8px',
          textDecoration: 'none',
          marginBottom: '40px',
          fontWeight: 'bold',
          fontSize: '1rem',
        }}>
          Reach Out to Our Team →
        </a>
      </section>

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