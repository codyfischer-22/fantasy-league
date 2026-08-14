'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

  useEffect(() => {
    const loadInstances = async () => {
      const { data } = await supabase
        .from('leagues')
        .select('*')
        .eq('league_type', type)
        .eq('is_private', false)

      setInstances(data ?? [])
      setPageLoading(false)
    }

    loadInstances()
  }, [type])

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

        <div style={{ textAlign: 'left', marginBottom: '48px', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>

          <h1 style={{ color: '#f0b429', fontSize: '3rem', marginBottom: '3px' }}>
            🏝️ Welcome to Politics on the Beach!
          </h1>

          <p style={{
            color: '#a0a0b0',
            fontSize: '1.1rem',
            lineHeight: '1.2',
            marginBottom: '28px'
          }}>
            For the last 25 years, America&apos;s screens and hearts have been graced with the iconic television series Survivor. This fantasy league emerged for Survivor 50, with its zany fan favorites, but it continues today for a new generation of players in Fiji and on this app.
          </p>

          <p style={{
            color: '#a0a0b0',
            fontSize: '1.1rem',
            lineHeight: '1.2',
            marginBottom: '28px'
          }}>
            Whether or not you&apos;ve played fantasy leagues before, please trust we&apos;ll guide you through this process. We encourage you to enter into the fun league spirit and community as much as possible! Draft tribes, make trades, watch episodes, and then get up off your couch and live your own adventure!
          </p>

          <p style={{
            color: '#f0b429',
            fontSize: '1.2rem',
            lineHeight: '1.2',
            marginBottom: '28px'
          }}>
            To ensure your spot in a league, register by September 13th, 11:59 PM CT.
          </p>

          <p style={{
            color: '#f0b429',
            fontSize: '1.2rem',
            lineHeight: '1.2',
            marginBottom: '28px'
          }}>
            Drafts will occur between September 16, 7 PM CT, and September 20, 7 PM CT.
          </p>

          <p style={{
            color: '#a0a0b0',
            fontSize: '1.1rem',
            lineHeight: '1.2',
            marginBottom: '28px'
          }}>
            Each tribe drafts 4 real-life castaways with the top 3 point-scorers counted toward season totals.
          </p>

          <p style={{
            color: '#a0a0b0',
            fontSize: '1.1rem',
            lineHeight: '1.2',
            marginBottom: '28px'
          }}>
            Island politics are dangerous business! Can you survive?!
          </p>

        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
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

            <h2 style={{ color: '#f0b429', fontSize: '1.7rem', marginBottom: '8px' }}>
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
            <h2 style={{ color: '#f0b429', fontSize: '1.7rem', marginBottom: '8px' }}>
              📋 Drafting & Trading <span className="demo-arrow">→</span>
</h2>
            <p style={{ color: '#a0a0b0', fontSize: '1rem', lineHeight: '1.5' }}>
              Study up on on draft windows, snake order, selection length, trade rules, etc.
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
            <h2 style={{ color: '#f0b429', fontSize: '1.7rem', marginBottom: '16px' }}>
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
      style: {
        backgroundColor: '#12121a',
        border: '0px solid #f0b429',
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
            <h2 style={{ color: '#f0b429', fontSize: '1.7rem', marginBottom: '16px' }}>
              🔒 Private Leagues
            </h2>
            <p style={{ color: '#555570', fontSize: '0.9rem', marginBottom: '12px' }}>
              Coming soon! Hosted by Crew Chiefs and Team Principals for their own private groups.
            </p>
            <p className="create-league-link" style={{ color: '#555570', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'default' }}>
              Create a League → (Coming soon!)
            </p>
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
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#f0b429', fontSize: '1.7rem', marginBottom: '16px' }}>
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