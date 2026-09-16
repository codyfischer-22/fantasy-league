'use client'
import { Search, Play, X } from 'lucide-react'

const resourcesByLeague: Record<string, { title: string; url: string }[]> = {
  'secrets-on-the-beach': [
    {
      title: '3-Minute Snapshot (Reality Sea)',
      url: 'https://www.facebook.com/reel/1598597491615056/',
    },
    {
      title: '40-Minute Deep Dive (CBS)',
      url: 'https://www.youtube.com/watch?v=KXLSVRsI3pk',
    },
    {
      title: 'Survivor 51 Playlist (RHAP)',
      url: 'https://youtube.com/playlist?list=PLG146qFvxINI&si=tff2kAJaFP2t814m',
    },
  ],
  'sotb-demo': [
    {
      title: '3-Minute Snapshot (Reality Sea)',
      url: 'https://www.facebook.com/reel/1598597491615056/',
    },
    {
      title: '40-Minute Deep Dive (CBS)',
      url: 'https://www.youtube.com/watch?v=KXLSVRsI3pk',
    },
    {
      title: 'Survivor 51 Playlist (RHAP)',
      url: 'https://youtube.com/playlist?list=PLG146qFvxINI&si=tff2kAJaFP2t814m',
    },
  ],
  'uncharted-turretory': [
    {
      title: '3-Minute Snapshot (Cami Twomey)',
      url: 'https://youtube.com/shorts/QkLIOPvkSYU?si=x6-rYZA186CiqOng',
    },
    {
      title: 'Breakdown Article (EW)',
      url: 'https://ew.com/the-traitors-new-blood-first-ever-all-civilian-cast-revealed-exclusive-12056293',
    },   
  ],
}

export default function ResourcesModal({ open, onClose, type }: { open: boolean; onClose: () => void; type: string }) {
  if (!open) return null

  const resources = resourcesByLeague[type] ?? []
  const castawayTerm = type === 'uncharted-turretory' ? 'Castle-Goers' : 'Castaways'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '420px',
          width: '90%',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: '#f0b429', fontSize: '1.3rem', margin: 0 }}>
            Research {castawayTerm}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0a0b0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.5' }}>
          A few resources to help you get to know this season&apos;s {castawayTerm} before drafting or ranking:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {resources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#12121a',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              <Play size={16} strokeWidth={2} color="#f0b429" /> {r.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}