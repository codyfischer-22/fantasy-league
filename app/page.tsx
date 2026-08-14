'use client'

import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#ffffff'
    }}>

      {/* ─── HERO ─── */}
      <section style={{
        textAlign: 'center',
        padding: '80px 40px',
        background: 'linear-gradient(180deg, #12121a 0%, #0a0a0f 100%)'
      }}>
        <h2 style={{
          fontSize: '3rem',
          color: '#ffffff',
          marginBottom: '16px',
          letterSpacing: '1px'
        }}>
          Fantasy without the Pigskin, <span style={{ color: '#f0b429' }}>Finally</span>
        </h2>
        <p style={{
  color: '#a0a0b0',
  fontSize: '1.2rem',
  maxWidth: '600px',
  margin: '0 auto 16px auto',
  lineHeight: '1.7'
}}>
  Move over, Football! Here comes a new wave of fantasy leagues for the cutthroat, the speed junkies, and the adventurous at heart.
</p>
<p style={{
  color: '#a0a0b0',
  fontSize: '1.2rem',
  maxWidth: '800px',
  margin: '0 auto 32px auto',
  lineHeight: '1.7'
}}>
  <span style={{ fontStyle: 'italic' }}>Trekkon</span> is derived from the biblical <span style={{ fontStyle: 'italic' }}>"τρέχω,"</span> to race or run, and <span style={{ fontStyle: 'italic' }}>"ἀγών,"</span> a gathering place for games, competitions, or battles.
We inspire players to cheer on and team up with reality television stars and drivers in the hopes they&apos;ll race out and conquer their own battles!
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
        padding: '60px 40px',
        backgroundColor: '#0a0a0f',
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#f0b429',
          fontSize: '2.25rem',
          marginBottom: '4px',
          letterSpacing: '2px'
        }}>
        Membership Tiers
        </h2>
       <p style={{
  textAlign: 'center',
  color: '#a0a0b0',
  marginBottom: '40px',
  fontSize: '1.0rem'
}}>
  Prices shown <span style={{ fontWeight: 'bold' }}>per month</span> unless you opt for the yearlong pass (coming soon) good for all leagues.
</p>

        <div style={{
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
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚓</div>
            <h3 style={{ fontSize: '1.1rem', color: '#a0a0b0', marginBottom: '8px' }}>Stowaway</h3>
            <div style={{ fontSize: '2rem', color: '#a0a0b0', fontWeight: 'bold', marginBottom: '16px' }}>
              $0.00
            </div>
            <ul style={{ color: '#a0a0b0', fontSize: '0.85rem', textAlign: 'left', lineHeight: '2', listStyle: 'none', padding: 0 }}>
              <li>✅ Join 1 Public League</li>
              <li>✅ Private League Access</li>
              <li>✅ Basic Leaderboards</li>
      <li>✅ Trade Portal Access</li>
              <li>❌ No Public Chat</li>
              <li>❌ No Analytics</li>
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
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🥭</div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '8px' }}>Castaway</h3>
            <div style={{ fontSize: '2rem', color: '#ffffff', fontWeight: 'bold', marginBottom: '16px' }}>
              $3.99
            </div>
            <ul style={{ color: '#a0a0b0', fontSize: '0.85rem', textAlign: 'left', lineHeight: '2', listStyle: 'none', padding: 0 }}>
              <li>✅ Multiple Public Leagues</li>
              <li>✅ Private League Access</li>
              <li>✅ Basic Leaderboards</li>
              <li>✅ Trade Portal Access</li>
              <li>✅ Public League Chat</li>
              <li>✅ Tracking Analytics</li>
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
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔧</div>
            <h3 style={{ fontSize: '1.1rem', color: 'rgb(245, 255, 156)', marginBottom: '8px' }}>Crew Chief</h3>
            <div style={{ fontSize: '2rem', color: 'rgb(245, 255, 156)', fontWeight: 'bold', marginBottom: '16px' }}>
              $9.99
            </div>
            <ul style={{ color: '#a0a0b0', fontSize: '0.85rem', textAlign: 'left', lineHeight: '2', listStyle: 'none', padding: 0 }}>
              <li>✅ Multiple Public Leagues</li>
              <li>✅ Private League Access</li>
              <li>✅ Basic Leaderboards</li>
                 <li>✅ Trade Portal Access</li>
                 <li>✅ Public League Chat</li>
              <li>✅ Tracking Analytics</li>
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
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              BEST VALUE
            </div>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🚀</div>
            <h3 style={{ fontSize: '1.1rem', color: '#f0b429', marginBottom: '8px' }}>
              Team Principal
            </h3>
            <div style={{ fontSize: '2rem', color: '#f0b429', fontWeight: 'bold', marginBottom: '16px' }}>
              $14.99
            </div>
            <ul style={{ color: '#a0a0b0', fontSize: '0.85rem', textAlign: 'left', lineHeight: '2', listStyle: 'none', padding: 0 }}>
           <li>✅ Multiple Public Leagues</li>
              <li>✅ Private League Access</li>
              <li>✅ Basic Leaderboards</li>
                 <li>✅ Trade Portal Access</li>
                 <li>✅ Public League Chat</li>
              <li>✅ Tracking Analytics</li>
              <li>⭐ Host 3 18-Player Leagues</li>
              <li>✅ Custom League Settings</li>
              
            </ul>
          </div>

        </div>

{/* All-Access Teaser */}
        <div style={{
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
            padding: '28px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#ca29ca', fontSize: '1.5rem', marginBottom: '8px' }}>
              <span style={{ color: '#ca29ca', fontWeight: 'bold' }}>Coming in 2027:</span>
              {' '}
              <span style={{ color: '#ffffff', fontWeight: 'bold' }}>All-Access Pass</span>
            </h3>
            <p style={{ color: '#a0a0b0', fontSize: '1.2rem', lineHeight: '1.7' }}>
              Annual price for every league, every season, and every perk!
            </p>
          </div>

        </div>
      </section>

      {/* ─── LEAGUES ─── */}
      <section id="leagues" style={{ padding: '60px 40px' }}>
        <h2 style={{
          textAlign: 'center',
          color: '#f0b429',
          fontSize: '2.25rem',
          marginBottom: '30px',
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
  <h3 style={{ color: '#f0b429', fontSize: '1.6rem', marginBottom: '8px' }}>
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
    color: '#a0a0b0'
  }}>
    💰 From <span style={{ color: '#f0b429', fontWeight: 'bold' }}>$0.00</span> / Season
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
            <h3 style={{ color: 'rgb(245, 255, 156)', fontSize: '1.6rem', marginBottom: '8px' }}>
              🚗 'Muricans Turn Left
            </h3>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Coming in 2027, climb through the cargo net for 36 weeks of thunder and see how many points you can drive to the checkered flag.
            </p>
            <div style={{
              backgroundColor: '#12121a',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: '#a0a0b0'
            }}>
              ⏳ <span style={{ color: '#a0a0b0', fontWeight: 'bold' }}>Coming Soon!</span>
            </div>
            <button style={{
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
              cursor: 'not-allowed'
            }}>
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
            <h3 style={{ color: '#f0b429', fontSize: '1.6rem', marginBottom: '8px' }}>
             🏎️ European Rockets
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
              color: '#a0a0b0'
            }}>
              ⏳ <span style={{ color: '#a0a0b0', fontWeight: 'bold' }}>Coming Soon!</span>
            </div>
            <button style={{
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
              cursor: 'not-allowed'
            }}>
Red Lights Out →
            </button>
          </div>
        </div>
      </section>

      {/* ─── SUGGEST A LEAGUE ─── */}
      <section id="suggest" style={{
        padding: '60px 40px',
        textAlign: 'center',
        backgroundColor: '#0a0a0f',
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#f0b429',
          fontSize: '2.25rem',
          marginBottom: '4px',
          letterSpacing: '2px'
        }}>
        Suggest a New League
        </h2>
        <p style={{
          color: '#a0a0b0',
          fontSize: '1.0rem',
          maxWidth: '500px',
          margin: '0 auto 28px auto',
          lineHeight: '1.7'
        }}>
          Got an idea for a fantasy league we should build next? Send us your concept and help shape
          the future of Trekkon Fantasy Leagues.
        </p>
        <a href="mailto:codyray.fischer@gmail.com" className="btn" style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '14px 32px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '1rem',
        }}>
          Reach Out to Our Team →
        </a>
      </section>

    </main>
  )
}