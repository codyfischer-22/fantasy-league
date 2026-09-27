'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { Trophy, Earth, Lock, RefreshCw, ExternalLink, Plus } from 'lucide-react'

type LeagueRow = {
  id: number
  name: string
  slug: string
  league_type: string
  is_private: boolean
  is_archived: boolean
  is_show_chat: boolean
  draft_status: string | null
  base_clone_count: number | null
  host_user_id: string | null
  memberCount: number
  hostName: string | null
}

const leagueTypeOptions = [
  { value: 'secrets-on-the-beach', label: 'Secrets on the Beach' },
  { value: 'uncharted-turretory', label: 'Uncharted Turretory' },
  { value: 'paddock-politicks', label: 'Paddock Politicks' },
  { value: 'the-oval-offset', label: 'The Oval Offset' },
]

const leagueTypeEmojis: Record<string, string> = {
  'secrets-on-the-beach': '🏝️',
  'uncharted-turretory': '🗡️',
  'paddock-politicks': '🏎️',
  'the-oval-offset': '🚗',
}
export default function AdminLeaguesPage() {
  const { user, loading } = useAuth()
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [leagues, setLeagues] = useState<LeagueRow[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [includeSandbox, setIncludeSandbox] = useState(false)
  const [runningId, setRunningId] = useState<number | null>(null)
  const [runMessage, setRunMessage] = useState<Record<number, string>>({})

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newLeagueName, setNewLeagueName] = useState('')
  const [newLeagueSlug, setNewLeagueSlug] = useState('')
  const [newLeagueType, setNewLeagueType] = useState(leagueTypeOptions[0].value)
  const [creating, setCreating] = useState(false)
  const [createMessage, setCreateMessage] = useState('')
  const [deletingLeague, setDeletingLeague] = useState<LeagueRow | null>(null)
const [deleteMode, setDeleteMode] = useState<'archive' | 'delete' | 'unarchive'>('archive')
const [deleting, setDeleting] = useState(false)


  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setChecking(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_global_admin')
        .eq('user_id', user.id)
        .single()
      setIsGlobalAdmin(profile?.is_global_admin ?? false)
      setChecking(false)
    }
    if (!loading) checkAdmin()
  }, [user, loading])

  const loadLeagues = async () => {
    setPageLoading(true)

    const { data: leagueRows } = await supabase
  .from('leagues')
  .select('id, name, slug, league_type, is_private, is_archived, is_show_chat, draft_status, base_clone_count, host_user_id')
  .order('name')

    const allLeagues = leagueRows ?? []

    const { data: memberRows } = await supabase
      .from('league_members')
      .select('league_id')

    const memberCounts = new Map<number, number>()
    ;(memberRows ?? []).forEach((m) => {
      memberCounts.set(m.league_id, (memberCounts.get(m.league_id) ?? 0) + 1)
    })

    const hostIds = [...new Set(allLeagues.map((l) => l.host_user_id).filter((id): id is string => !!id))]
    const hostNameMap = new Map<string, string>()
    if (hostIds.length > 0) {
      const { data: hostProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', hostIds)
      ;(hostProfiles ?? []).forEach((p) => hostNameMap.set(p.user_id, p.display_name || 'Unnamed Host'))
    }

    const enriched: LeagueRow[] = allLeagues.map((l) => ({
      ...l,
      memberCount: memberCounts.get(l.id) ?? 0,
      hostName: l.host_user_id ? hostNameMap.get(l.host_user_id) ?? 'Unnamed Host' : null,
    }))

    setLeagues(enriched)
    setPageLoading(false)
  }

  useEffect(() => {
    if (isGlobalAdmin) loadLeagues()
  }, [isGlobalAdmin])

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

const handleArchiveLeague = async (league: LeagueRow) => {
  setDeleting(true)
  const { error, count } = await supabase
    .from('leagues')
    .update({ is_archived: !league.is_archived }, { count: 'exact' })
    .eq('id', league.id)
  setDeleting(false)

  if (error) {
    console.error('Error archiving league:', JSON.stringify(error, null, 2))
    alert('Something went wrong updating this league.')
    return
  }
  if (!count || count === 0) {
    alert('The update didn\'t apply — this is likely a permissions (RLS) issue, not a bug in the page itself.')
    return
  }

  setDeletingLeague(null)
  await loadLeagues()
}

const handleDeleteLeague = async (league: LeagueRow) => {
  setDeleting(true)
  const { error, count } = await supabase
    .from('leagues')
    .delete({ count: 'exact' })
    .eq('id', league.id)
  setDeleting(false)

  if (error) {
    console.error('Error deleting league:', JSON.stringify(error, null, 2))
    alert('Something went wrong deleting this league. It may still be referenced somewhere the cascade doesn\'t cover.')
    return
  }
  if (!count || count === 0) {
    alert('The delete didn\'t apply — this is likely a permissions (RLS) issue, not a bug in the page itself.')
    return
  }

  setDeletingLeague(null)
  await loadLeagues()
}

  const handleCreateLeague = async () => {
  if (!newLeagueName.trim()) {
    setCreateMessage('Enter a league name first.')
    return
  }
  if (!newLeagueSlug.trim()) {
    setCreateMessage('Enter a slug first.')
    return
  }
  const finalSlug = slugify(newLeagueSlug)

  setCreating(true)
  setCreateMessage('')

  const { data: existing } = await supabase
    .from('leagues')
    .select('id')
    .eq('league_type', newLeagueType)
    .eq('slug', finalSlug)
    .maybeSingle()

  if (existing) {
    setCreating(false)
    setCreateMessage('A league with this slug already exists for this league type. Try a different slug.')
    return
  }

  const { error } = await supabase.from('leagues').insert({
    name: newLeagueName.trim(),
    slug: finalSlug,
    league_type: newLeagueType,
    is_private: false,
    host_user_id: null,
    is_show_chat: false,
  })

  setCreating(false)

  if (error) {
    console.error('Error creating league:', JSON.stringify(error, null, 2))
    setCreateMessage('Something went wrong creating the league. Check console.')
    return
  }

  setCreateMessage('League created!')
  setNewLeagueName('')
  setNewLeagueSlug('')
  await loadLeagues()
}

  const handleRunPublicDraft = async (league: LeagueRow) => {
    if (league.memberCount < 3) {
      setRunMessage((prev) => ({ ...prev, [league.id]: 'Needs at least 3 members before drafting.' }))
      return
    }
    const confirmed = window.confirm(
      `Run the public draft simulation for "${league.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setRunningId(league.id)
    setRunMessage((prev) => ({ ...prev, [league.id]: '' }))

    const { error } = await supabase.rpc('run_public_draft', { target_league_id: league.id })

    setRunningId(null)

    if (error) {
      console.error('Error running public draft:', error)
      setRunMessage((prev) => ({ ...prev, [league.id]: 'Something went wrong. Check console.' }))
      return
    }

    setRunMessage((prev) => ({ ...prev, [league.id]: 'Draft complete!' }))
    await loadLeagues()
  }

  if (loading || checking) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  if (!user || !isGlobalAdmin) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        <p>Access denied.</p>
      </main>
    )
  }

const filteredLeagues = leagues.filter((l) => {
  const isAdminToolLeague =
  l.league_type === 'sandbox' ||
  l.league_type === 'sotb-demo' ||
  l.league_type === 'uncharted-turretory-demo' ||
  l.is_show_chat
  if (!includeSandbox && isAdminToolLeague) return false
    if (!includeArchived && l.is_archived) return false
    if (filterType === 'public' && l.is_private) return false
    if (filterType === 'private' && !l.is_private) return false
    if (search.trim() && !l.name.toLowerCase().includes(search.trim().toLowerCase())) return false
    return true
  })

  const statusLabel = (status: string | null) => {
    if (status === 'completed') return { text: 'Drafted', color: '#068e38' }
    if (status === 'in_progress') return { text: 'Drafting', color: '#f0b429' }
    return { text: 'Not Started', color: '#555570' }
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <a href="/admin/dashboard" style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Back to Admin Dashboard
        </a>

        <h1 style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trophy size={32} strokeWidth={2} color="#f0b429" />
          <span style={{ color: '#f0b429' }}>League & Season</span>{' '}
          <span style={{ color: '#ffffff' }}>Management</span>
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px' }}>
          Keep tabs on every league on the platform, public and private. Create new public leagues, run draft simulations, or jump straight into any league's pages.
        </p>

        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => { setShowCreateForm(!showCreateForm); setCreateMessage('') }}
            style={{
              backgroundColor: showCreateForm ? 'transparent' : '#f0b429',
              color: showCreateForm ? '#f0b429' : '#0a0a0f',
              border: '1px solid #f0b429',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={16} strokeWidth={2} />
            {showCreateForm ? 'Cancel' : 'Create Public League'}
          </button>

          {showCreateForm && (
            <div style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #f0b429',
              borderRadius: '10px',
              padding: '20px',
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div>
                <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
                  League Type
                </label>
                <select
  value={newLeagueType}
  onChange={(e) => {
    const newType = e.target.value
    const newEmoji = leagueTypeEmojis[newType] ?? ''
    setNewLeagueType(newType)
    setNewLeagueName((prev) => {
      const stripped = Object.values(leagueTypeEmojis).reduce(
        (acc, emoji) => (acc.startsWith(emoji) ? acc.slice(emoji.length).trimStart() : acc),
        prev
      )
      return newEmoji ? `${newEmoji} ${stripped}` : stripped
    })
  }}
  style={{
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#12121a',
    color: '#ffffff',
  }}
>
  {leagueTypeOptions.map((opt) => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
                  League Name
                </label>
                <input
                  type="text"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="e.g. 🏝️ Survivor 51 Public League"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #2a2a3e',
                    backgroundColor: '#12121a',
                    color: '#ffffff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
                  League Slug
                </label>
                <input
                  type="text"
                  value={newLeagueSlug}
                  onChange={(e) => setNewLeagueSlug(e.target.value)}
                  placeholder="e.g. survivor-51-public"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #2a2a3e',
                    backgroundColor: '#12121a',
                    color: '#ffffff',
                  }}
                />
              </div>

              <button
                onClick={handleCreateLeague}
                disabled={creating}
                style={{
                  backgroundColor: '#f0b429',
                  color: '#0a0a0f',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? 'Creating...' : 'Create League'}
              </button>

              {createMessage && (
                <p style={{ color: '#f0b429', fontSize: '0.85rem' }}>{createMessage}</p>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by League Name..."
            style={{
              flex: '1 1 240px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #2a2a3e',
              backgroundColor: '#12121a',
              color: '#ffffff',
            }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'public' | 'private')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #2a2a3e',
              backgroundColor: '#12121a',
              color: '#ffffff',
            }}
          >
            <option value="all">All Leagues</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#a0a0b0' }}>
            <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
            Show Archived
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#a0a0b0' }}>
            <input type="checkbox" checked={includeSandbox} onChange={(e) => setIncludeSandbox(e.target.checked)} />
            Show Admin Tools
          </label>
        </div>

        {pageLoading ? (
          <p style={{ color: '#a0a0b0' }}>Loading leagues...</p>
        ) : filteredLeagues.length === 0 ? (
          <p style={{ color: '#555570' }}>No leagues match these filters.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredLeagues.map((league) => {
              const status = statusLabel(league.draft_status)
const canRunDraft = !league.is_private && !league.is_show_chat && (league.draft_status === null || league.draft_status === 'not_started')
              return (
                <div key={league.id} style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {league.is_private ? (
                      <Lock size={20} strokeWidth={2} color="#a0a0b0" style={{ flexShrink: 0 }} />
                    ) : (
                      <Earth size={20} strokeWidth={2} color="#a0a0b0" style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
  {league.name}
  {league.is_archived && <span style={{ color: '#ff6b6b', fontSize: '0.75rem' }}> (Archived)</span>}
  {league.is_show_chat && <span style={{ color: '#f0b429', fontSize: '0.75rem' }}> (Chat Infrastructure — Do Not Delete)</span>}
</div>
                      <div style={{ color: '#555570', fontSize: '0.8rem' }}>
                        {league.league_type} • {league.memberCount} member{league.memberCount === 1 ? '' : 's'}
                        {league.is_private && league.hostName && ` • Hosted by ${league.hostName}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}> 
                  {!league.is_show_chat && (
  <span style={{
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: status.color,
    backgroundColor: '#12121a',
    padding: '4px 10px',
    borderRadius: '20px',
  }}>
    {status.text}
  </span>
)}
                    {canRunDraft && (
                      <button
                        onClick={() => handleRunPublicDraft(league)}
                        disabled={runningId === league.id}
                        title={league.memberCount < 3 ? 'Needs at least 3 members' : undefined}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#f0b429',
                          border: '1px solid #f0b429',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          cursor: runningId === league.id ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <RefreshCw size={14} strokeWidth={2} />
                        {runningId === league.id ? 'Running...' : 'Run Draft'}
                      </button>
                    )}
{!league.is_show_chat && (
                    <a
                      href={`/leagues/${league.league_type}/${league.slug}`}
                      style={{
                        color: '#a0a0b0',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      View <ExternalLink size={14} strokeWidth={2} />
                    </a>
)}
{!league.is_show_chat && (
<button
  onClick={() => { setDeletingLeague(league); setDeleteMode(league.is_archived ? 'unarchive' : 'archive') }}
  style={{
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    border: '1px solid #2a2a3e',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer',
  }}
>
  {league.is_archived ? 'Unarchive' : 'Archive'}
</button>
)}
{!league.is_show_chat && (
  <button
    onClick={() => { setDeletingLeague(league); setDeleteMode('delete') }}
    style={{
      backgroundColor: 'transparent',
      color: '#ff6b6b',
      border: '1px solid #ff6b6b',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      cursor: 'pointer',
    }}
  >
    Delete
  </button>
)}

                  </div>

                  {runMessage[league.id] && (
                    <p style={{ width: '100%', color: '#f0b429', fontSize: '0.8rem', marginTop: '4px' }}>
                      {runMessage[league.id]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

{deletingLeague && (
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
      border: `1px solid ${deleteMode === 'delete' ? '#ff6b6b' : '#f0b429'}`,
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '420px',
      textAlign: 'left'
    }}>
     <h3 style={{ color: deleteMode === 'delete' ? '#ff6b6b' : '#f0b429', fontSize: '1.2rem', marginBottom: '12px' }}>
  {deleteMode === 'delete'
    ? 'Permanently Delete League?'
    : deletingLeague.is_archived
      ? 'Unarchive League?'
      : 'Archive League?'}
</h3>
<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.6' }}>
  {deleteMode === 'delete' ? (
    <>
            This will <strong style={{ color: '#ff6b6b' }}>permanently delete</strong> "{deletingLeague.name}" and every related row: draft picks, trades, predictions, chat history... everything. This cannot be undone.
            </>
  ) : deletingLeague.is_archived ? (
    <>
      "{deletingLeague.name}" will become visible again in all normal listings and pages.
    </>
  ) : (
    <>
            "{deletingLeague.name}" will be hidden from all normal listings and pages, but its data stays intact and can be reviewed later. This is reversible.
          </>
        )}
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
        <button
  onClick={() => deleteMode === 'delete' ? handleDeleteLeague(deletingLeague) : handleArchiveLeague(deletingLeague)}
  disabled={deleting}
  style={{
    backgroundColor: deleteMode === 'delete' ? '#ff6b6b' : '#f0b429',
    color: deleteMode === 'delete' ? '#ffffff' : '#0a0a0f',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 'bold',
    cursor: deleting ? 'not-allowed' : 'pointer'
  }}
>
  {deleting
    ? 'Working...'
    : deleteMode === 'delete'
      ? 'Delete Permanently'
      : deletingLeague.is_archived
        ? 'Unarchive League'
        : 'Archive League'}
</button>
        <button
          onClick={() => setDeletingLeague(null)}
          style={{
            backgroundColor: 'transparent',
            color: '#a0a0b0',
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #2a2a3e',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </main>
  )
}