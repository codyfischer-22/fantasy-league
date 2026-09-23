'use client'

import { MicSignal, NotebookPen, SquarePlay } from 'lucide-react'

export default function ExtrasPage() {
  return (
    <main style={{
      backgroundColor: '#0a0a0f',
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
          <MicSignal size={32} strokeWidth={2} color="#f0b429" style={{ flexShrink: 0 }} />
          <span style={{ color: '#f0b429' }}>Original</span>
          <span style={{ color: '#ffffff' }}>Media</span>
        </h1>

        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.6', marginTop: '-20px', marginBottom: '24px' }}>
          Check out podcasts, blogs, and who knows what from Trekkon Fantasy Leagues!
        </p>

        {/* Podcast Section */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MicSignal size={22} strokeWidth={2} color="#f0b429" />
            Podcasts
          </h2>
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #2a2a3e',
            borderRadius: '10px',
            padding: '20px'
          }}>
        <iframe
  style={{ borderRadius: '12px' }}
  src="https://open.spotify.com/embed/show/7HR9XTBY9tbnZWciUOM0NZ?utm_source=generator"
  width="100%"
  height="152"
  frameBorder="0"
  allowFullScreen
  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
  loading="lazy"
></iframe>
  </div>
</div>

        {/* Blog Section */}
        <div style={{ marginBottom: '0px' }}>
          <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotebookPen size={22} strokeWidth={2} color="#f0b429" />
            Blogs
          </h2>
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #2a2a3e',
            borderRadius: '10px',
            padding: '20px'
          }}>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Episode write-ups are in the works. Check back soon for blog drops!
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}