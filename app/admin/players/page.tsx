'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { UserCog, Search } from 'lucide-react'

type Player = {
  user_id: string
  display_name: string | null
  email: string | null
  tier: string
  is_global_admin: boolean | null
  is_league_admin: boolean | null
  admin_league_types: string[]
  email_opt_in: boolean | null
  joined_at: string | null
  last_sign_in_at: string | null
}

type Draft = { tier: string; is_league_admin: boolean; admin_league_types: string[] }

const TIER_OPTIONS = [
  { value: 'stowaway', label: 'Stowaway', color: '#a0a0b0' },
  { value: 'castaway', label: 'Castaway', color: '#ffffff' },
  { value: 'crewchief', label: 'Crew Chief', color: 'rgb(245, 255, 156)' },
  { value: 'teamprincipal', label: 'Team Principal', color: '#f0b429' },
]

const LEAGUE_TYPE_OPTIONS = [
  { value: 'secrets-on-the-beach', label: 'Secrets on the Beach' },
  { value: 'sotb-demo', label: 'Beach Demo' },
  { value: 'uncharted-turretory', label: 'Uncharted Turretory' },
  { value: 'uncharted-turretory-demo', label: 'Turretory Demo' },
  { value: 'sandbox', label: 'Sandbox' },
]

function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token ?? ''}`,
  }
}

export default function PlayerManagementPage() {
  const { user, loading } = useAuth()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [status, setStatus] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [loadError, setLoadError] = useState('')

  async function loadPlayers() {
    const res = await fetch('/api/admin/players', { headers: await authHeaders() })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setLoadError(data.error ?? 'Could not load players.')
      return
    }
    setPlayers(data.players)
    const fresh: Record<string, Draft> = {}
    for (const p of data.players as Player[]) {
      fresh[p.user_id] = {
        tier: p.tier,
        is_league_admin: Boolean(p.is_league_admin),
        admin_league_types: p.admin_league_types ?? [],
      }
    }
    setDrafts(fresh)
  }

  useEffect(() => {
    async function check() {
      if (!user) { setAllowed(false); return }
      const { data } = await supabase.from('profiles').select('is_global_admin').eq('user_id', user.id).single()
      const ok = Boolean(data?.is_global_admin)
      setAllowed(ok)
      if (ok) loadPlayers()
    }
    if (!loading) check()
  }, [user, loading])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return players.filter((p) => {
      const matchesText = !q || (p.display_name ?? '').toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q)
      const matchesTier = tierFilter === 'all' || (tierFilter === 'admins' ? (p.is_global_admin || p.is_league_admin) : p.tier === tierFilter)
      return matchesText && matchesTier
    })
  }, [players, search, tierFilter])

  function isChanged(p: Player) {
    const d = drafts[p.user_id]
    if (!d) return false
    const sameTypes = [...d.admin_league_types].sort().join(',') === [...(p.admin_league_types ?? [])].sort().join(',')
    return d.tier !== p.tier || d.is_league_admin !== Boolean(p.is_league_admin) || !sameTypes
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
    setStatus((prev) => ({ ...prev, [id]: '' }))
  }

  function toggleLeagueType(id: string, type: string) {
    const current = drafts[id]?.admin_league_types ?? []
    updateDraft(id, {
      admin_league_types: current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    })
  }

  async function savePlayer(p: Player) {
    const d = drafts[p.user_id]
    if (d.is_league_admin && d.admin_league_types.length === 0) {
      setStatus((prev) => ({ ...prev, [p.user_id]: 'Pick at least one league for this League Admin to score.' }))
      return
    }
    setSavingId(p.user_id)
    const res = await fetch('/api/admin/players', {
      method: 'PATCH',
      headers: await authHeaders(),
      body: JSON.stringify({ user_id: p.user_id, ...d }),
    })
    const data = await res.json().catch(() => ({}))
    setSavingId(null)
    if (!res.ok) {
      setStatus((prev) => ({ ...prev, [p.user_id]: data.error ?? 'Save failed.' }))
      return
    }
    setPlayers((prev) => prev.map((x) => (x.user_id === p.user_id
      ? { ...x, tier: d.tier, is_league_admin: d.is_league_admin, admin_league_types: d.is_league_admin ? d.admin_league_types : [] }
      : x)))
    if (!d.is_league_admin) updateDraft(p.user_id, { admin_league_types: [] })
    setStatus((prev) => ({ ...prev, [p.user_id]: 'Saved.' }))
  }

  const shell = (child: React.ReactNode) => (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
      {child}
    </main>
  )

  if (loading || allowed === null) return shell('Loading...')
  if (!allowed) return shell(<p>Access denied. Player Management is for Global Admins.</p>)

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: '6px', border: '1px solid #2a2a3e',
    backgroundColor: '#12121a', color: '#ffffff', fontFamily: 'inherit', fontSize: '0.9rem',
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div className="mobile-page-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <a href="/admin/dashboard" style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Back to Admin Dashboard
        </a>

        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', margin: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: '0px', columnGap: '10px' }}>
          <UserCog size={36} strokeWidth={2} color="#f0b429" />
          <span style={{ color: '#f0b429' }}>Player</span>{' '}
          <span className="mobile-full-width-break" style={{ color: '#ffffff' }}>Management</span>
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
          Change a player&apos;s membership tier or give them League Admin access to score episodes.
          Tier changes here skip payment and don&apos;t touch their Stripe subscription.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <label style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} color="#555570" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
            />
          </label>
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={inputStyle}>
            <option value="all">All tiers</option>
            {TIER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            <option value="admins">Admins only</option>
          </select>
        </div>

        {loadError && <p style={{ color: '#ff6b6b', marginBottom: '16px' }}>{loadError}</p>}

        <p style={{ color: '#555570', fontSize: '0.85rem', marginBottom: '12px' }}>
          Showing {filtered.length} of {players.length} players
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((p) => {
            const d = drafts[p.user_id]
            if (!d) return null
            const changed = isChanged(p)
            const tierColor = TIER_OPTIONS.find((t) => t.value === d.tier)?.color ?? '#ffffff'
            const msg = status[p.user_id]
            return (
              <div key={p.user_id} style={{
                backgroundColor: '#1a1a2e',
                border: `1px solid ${changed ? '#f0b429' : '#2a2a3e'}`,
                borderRadius: '10px',
                padding: '16px 18px',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {p.display_name || 'Unnamed Player'}
                      {p.is_global_admin && (
                        <span style={{ fontSize: '0.7rem', color: '#0a0a0f', backgroundColor: '#ca29ca', borderRadius: '20px', padding: '2px 10px' }}>Global Admin</span>
                      )}
                    </div>
                    <div style={{ color: '#a0a0b0', fontSize: '0.85rem', overflowWrap: 'anywhere' }}>{p.email ?? 'No email'}</div>
                    <div style={{ color: '#555570', fontSize: '0.8rem', marginTop: '4px' }}>
                      Joined {formatDate(p.joined_at)} · Last signed in {formatDate(p.last_sign_in_at)}
                      {p.email_opt_in ? ' · Gets emails' : ''}
                    </div>
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#a0a0b0' }}>
                    Tier
                    <select
                      value={d.tier}
                      onChange={(e) => updateDraft(p.user_id, { tier: e.target.value })}
                      style={{ ...inputStyle, color: tierColor, fontWeight: 'bold' }}
                    >
                      {TIER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </label>
                </div>

                <div style={{ borderTop: '1px solid #2a2a3e', marginTop: '14px', paddingTop: '12px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={d.is_league_admin}
                      onChange={(e) => updateDraft(p.user_id, { is_league_admin: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#f0b429' }}
                    />
                    League Admin
                  </label>

                  {d.is_league_admin && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ color: '#a0a0b0', fontSize: '0.8rem', marginBottom: '6px' }}>Can score:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {LEAGUE_TYPE_OPTIONS.map((lt) => {
                          const on = d.admin_league_types.includes(lt.value)
                          return (
                            <button
                              key={lt.value}
                              type="button"
                              onClick={() => toggleLeagueType(p.user_id, lt.value)}
                              aria-pressed={on}
                              style={{
                                padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer',
                                fontFamily: 'inherit',
                                border: `1px solid ${on ? '#f0b429' : '#2a2a3e'}`,
                                backgroundColor: on ? '#f0b429' : 'transparent',
                                color: on ? '#0a0a0f' : '#a0a0b0',
                                fontWeight: on ? 'bold' : 'normal',
                              }}
                            >
                              {lt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {(changed || msg) && (
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '14px' }}>
                    {changed && (
                      <button
                        onClick={() => savePlayer(p)}
                        disabled={savingId === p.user_id}
                        style={{
                          backgroundColor: '#f0b429', color: '#0a0a0f', border: 'none', borderRadius: '6px',
                          padding: '8px 20px', fontWeight: 'bold', fontFamily: 'inherit',
                          cursor: savingId === p.user_id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {savingId === p.user_id ? 'Saving...' : 'Save changes'}
                      </button>
                    )}
                    {msg && <span style={{ color: msg === 'Saved.' ? '#4ecdc4' : '#ff6b6b', fontSize: '0.85rem' }}>{msg}</span>}
                  </div>
                )}
              </div>
            )
          })}

          {players.length > 0 && filtered.length === 0 && (
            <p style={{ color: '#a0a0b0' }}>No players match that search. Try a different name or tier.</p>
          )}
        </div>
      </div>
    </main>
  )
}
