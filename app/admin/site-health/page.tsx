'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { HeartPulse, RefreshCw } from 'lucide-react'

type Health = {
  generatedAt: string
  players: {
    total: number; paying: number; tiers: Record<string, number>; emailOptIn: number
    new7: number; new30: number; active7: number; active30: number
  }
  leagues: {
    active: number; public: number; private: number; draftsLive: number; archived: number
    byType: Record<string, number>; memberships: number | null
  }
  activity: {
    chat24h: number | null; chat7d: number | null; predictions7d: number | null; notifications7d: number | null
  }
}

const TIER_LABELS: [string, string, string][] = [
  ['stowaway', 'Stowaway', '#a0a0b0'],
  ['castaway', 'Castaway', '#ffffff'],
  ['crewchief', 'Crew Chief', 'rgb(245, 255, 156)'],
  ['teamprincipal', 'Team Principal', '#f0b429'],
]

const LEAGUE_LABELS: Record<string, string> = {
  'secrets-on-the-beach': 'Secrets on the Beach',
  'sotb-demo': 'Beach Demo',
  'uncharted-turretory': 'Uncharted Turretory',
  'uncharted-turretory-demo': 'Turretory Demo',
  sandbox: 'Sandbox',
}

const show = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString())

function Stat({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '16px 18px' }}>
      <div style={{ fontSize: '1.9rem', fontWeight: 'bold', color: accent ?? '#ffffff', lineHeight: 1.1 }}>{value}</div>
      <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginTop: '6px' }}>{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ color: '#f0b429', fontSize: '1.3rem', margin: '0 0 12px 0' }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {children}
      </div>
    </section>
  )
}

export default function SiteHealthPage() {
  const { user, loading } = useAuth()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    setRefreshing(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/site-health', {
      headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) setHealth(data)
    else setError(data.error ?? 'Could not load site stats.')
    setRefreshing(false)
  }

  useEffect(() => {
    async function check() {
      if (!user) { setAllowed(false); return }
      const { data } = await supabase.from('profiles').select('is_global_admin').eq('user_id', user.id).single()
      const ok = Boolean(data?.is_global_admin)
      setAllowed(ok)
      if (ok) load()
    }
    if (!loading) check()
  }, [user, loading])

  const shell = (child: React.ReactNode) => (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
      {child}
    </main>
  )

  if (loading || allowed === null) return shell('Loading...')
  if (!allowed) return shell(<p>Access denied. Site Health is for Global Admins.</p>)

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div className="mobile-page-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <a href="/admin/dashboard" style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Back to Admin Dashboard
        </a>

        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', margin: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: '0px', columnGap: '10px' }}>
          <HeartPulse size={36} strokeWidth={2} color="#f0b429" />
          <span style={{ color: '#f0b429' }}>Site</span>{' '}
          <span className="mobile-full-width-break" style={{ color: '#ffffff' }}>Health</span>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem', margin: 0 }}>
            {health ? `Updated ${new Date(health.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Loading stats...'}
          </p>
          <button
            onClick={load}
            disabled={refreshing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent',
              color: '#f0b429', border: '1px solid #f0b429', borderRadius: '6px', padding: '6px 14px',
              fontFamily: 'inherit', fontSize: '0.85rem', cursor: refreshing ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <p style={{ color: '#ff6b6b', marginBottom: '16px' }}>{error}</p>}

        {health && (
          <>
            <Section title="Players">
              <Stat value={show(health.players.total)} label="Total players" accent="#f0b429" />
              <Stat value={show(health.players.paying)} label="Paid members" />
              <Stat value={show(health.players.new7)} label="New this week" />
              <Stat value={show(health.players.new30)} label="New in 30 days" />
              <Stat value={show(health.players.active7)} label="Signed in this week" />
              <Stat value={show(health.players.active30)} label="Signed in, 30 days" />
              <Stat value={show(health.players.emailOptIn)} label="Get email updates" />
            </Section>

            <Section title="Membership tiers">
              {TIER_LABELS.map(([key, label, color]) => (
                <Stat key={key} value={show(health.players.tiers[key])} label={label} accent={color} />
              ))}
            </Section>

            <Section title="Leagues">
              <Stat value={show(health.leagues.active)} label="Active leagues" accent="#f0b429" />
              <Stat value={show(health.leagues.public)} label="Public" />
              <Stat value={show(health.leagues.private)} label="Private" />
              <Stat value={show(health.leagues.draftsLive)} label="Drafts live now" accent={health.leagues.draftsLive > 0 ? '#4ecdc4' : undefined} />
              <Stat value={show(health.leagues.memberships)} label="League spots filled" />
              <Stat value={show(health.leagues.archived)} label="Archived" />
              {Object.entries(health.leagues.byType).map(([type, n]) => (
                <Stat key={type} value={show(n)} label={LEAGUE_LABELS[type] ?? type} />
              ))}
            </Section>

            <Section title="Activity">
              <Stat value={show(health.activity.chat24h)} label="Chat messages, 24 hours" />
              <Stat value={show(health.activity.chat7d)} label="Chat messages, 7 days" />
              <Stat value={show(health.activity.predictions7d)} label="Predictions, 7 days" />
              <Stat value={show(health.activity.notifications7d)} label="Notifications sent, 7 days" />
            </Section>
          </>
        )}
      </div>
    </main>
  )
}
