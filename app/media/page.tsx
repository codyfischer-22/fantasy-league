'use client'

import { MicSignal, SquareLibrary } from 'lucide-react'

export default function ExtrasPage() {
  return (
    <main className="mobile-shrink-main trekkon-bg" style={{
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

        <h1 style={{
          fontSize: 'clamp(1.6rem, 8vw, 2.25rem)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px 10px'
        }}>
          <SquareLibrary size={32} strokeWidth={2} color="#f0b429" style={{ flexShrink: 0 }} />
          <span style={{ color: '#f0b429' }}>Original</span>
          <span style={{ color: '#ffffff' }}>Media</span>
        </h1>

        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.6', marginTop: '-20px', marginBottom: '24px' }}>
          Check out podcasts, blogs, and who knows what from Trekkon Fantasy Leagues!
        </p>

        {/* Podcast Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { title: 'Secrets on the Beach', sub: 'A Survivor Podcast', list: 'PLH2t1c28BV7s' },
              { title: 'Uncharted Turretory', sub: 'A Traitors Podcast', list: 'PLLQ_n7kjZ1iM' },
            ].map((show) => (
              <div key={show.list} style={{ flex: '1 1 320px', minWidth: '280px' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                  <MicSignal size={20} strokeWidth={2} color="#f0b429" style={{ display: 'inline-block', verticalAlign: '-3px', marginRight: '6px' }} />
                  <span style={{ color: '#f0b429' }}>{show.title}:</span>
                  <span style={{ color: '#a0a0b0' }}> {show.sub}</span>
                </div>
                <iframe
                  style={{ borderRadius: '12px', width: '100%', aspectRatio: '16 / 9', border: 'none', display: 'block' }}
                  src={`https://www.youtube.com/embed/videoseries?list=${show.list}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}