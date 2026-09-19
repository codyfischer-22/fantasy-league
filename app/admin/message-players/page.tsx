'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { Mail } from 'lucide-react'

type Profile = {
  user_id: string
  email: string
  display_name: string | null
  email_opt_in: boolean
}

export default function MessagePlayersPage() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')
  const [sendAsNotification, setSendAsNotification] = useState(true)
  const [sendAsEmail, setSendAsEmail] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [allLeagues, setAllLeagues] = useState<{ id: number; name: string }[]>([])

const applyFilter = async (type: string) => {
  setFilterType(type)

  if (type.startsWith('league-')) {
  const leagueId = parseInt(type.replace('league-', ''))
  const { data: memberRows } = await supabase.from('league_members').select('user_id').eq('league_id', leagueId)
  const memberIds = new Set((memberRows ?? []).map((m) => m.user_id))
  const filtered = allProfiles.filter((p) => memberIds.has(p.user_id))
  setSelectedIds(new Set(filtered.map((p) => p.user_id)))
  return
}

  if (type === 'all') {
    setSelectedIds(new Set(allProfiles.map((p) => p.user_id)))
    return
  }

  if (type === 'no-league') {
    const { data: memberRows } = await supabase.from('league_members').select('user_id')
    const memberIds = new Set((memberRows ?? []).map((m) => m.user_id))
    const filtered = allProfiles.filter((p) => !memberIds.has(p.user_id))
    setSelectedIds(new Set(filtered.map((p) => p.user_id)))
    return
  }

  if (type === 'hosts') {
    const { data: hostedLeagues } = await supabase.from('leagues').select('host_user_id').eq('is_private', true)
    const hostIds = new Set((hostedLeagues ?? []).map((l) => l.host_user_id).filter(Boolean))
    const filtered = allProfiles.filter((p) => hostIds.has(p.user_id))
    setSelectedIds(new Set(filtered.map((p) => p.user_id)))
    return
  }

  if (type.startsWith('tier-')) {
    const tier = type.replace('tier-', '')
    const { data: tierProfiles } = await supabase.from('profiles').select('user_id').eq('tier', tier)
    const tierIds = new Set((tierProfiles ?? []).map((p) => p.user_id))
    const filtered = allProfiles.filter((p) => tierIds.has(p.user_id))
    setSelectedIds(new Set(filtered.map((p) => p.user_id)))
    return
  }

  if (type.startsWith('leaguetype-')) {
    const leagueType = type.replace('leaguetype-', '')
    const { data: leagues } = await supabase.from('leagues').select('id').eq('league_type', leagueType)
    const leagueIds = (leagues ?? []).map((l) => l.id)
    const { data: memberRows } = await supabase.from('league_members').select('user_id').in('league_id', leagueIds)
    const memberIds = new Set((memberRows ?? []).map((m) => m.user_id))
    const filtered = allProfiles.filter((p) => memberIds.has(p.user_id))
    setSelectedIds(new Set(filtered.map((p) => p.user_id)))
    return
  }

  if (type.startsWith('league-')) {
    const leagueId = parseInt(type.replace('league-', ''))
    const { data: memberRows } = await supabase.from('league_members').select('user_id').eq('league_id', leagueId)
    const memberIds = new Set((memberRows ?? []).map((m) => m.user_id))
    const filtered = allProfiles.filter((p) => memberIds.has(p.user_id))
    setSelectedIds(new Set(filtered.map((p) => p.user_id)))
    return
  }
}

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

      if (profile?.is_global_admin) {
        setIsAdmin(true)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, display_name, email_opt_in')
          .order('display_name')
        setAllProfiles(profiles ?? [])

          const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name')
    .order('name')
  setAllLeagues(leagues ?? [])
      }
      setChecking(false)
    }
    if (!loading) checkAdmin()
  }, [user, loading])

  const toggleSelected = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(allProfiles.map((p) => p.user_id)))
  }

  const clearAll = () => {
    setSelectedIds(new Set())
  }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim() || selectedIds.size === 0) {
      setResult('Please fill out a subject, message, and select at least one recipient.')
      return
    }

    if (!sendAsNotification && !sendAsEmail) {
      setResult('Please select at least one delivery method.')
      return
    }

    setSending(true)
    setResult('')

    const selectedProfiles = allProfiles.filter((p) => selectedIds.has(p.user_id))
    let notifSuccess = 0
    let emailSuccess = 0
    let emailFailed = 0
    let emailSkipped = 0

    if (sendAsNotification) {
      const { error } = await supabase.from('notifications').insert(
        selectedProfiles.map((p) => ({
          user_id: p.user_id,
          message: message,
          link: linkUrl || null,
        }))
      )
      if (!error) {
        notifSuccess = selectedProfiles.length
      }
    }

    if (sendAsEmail) {
      const optedInProfiles = selectedProfiles.filter((p) => p.email_opt_in)
      emailSkipped = selectedProfiles.length - optedInProfiles.length

      if (optedInProfiles.length > 0) {
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        const recipients = optedInProfiles.map((p) => ({
          email: p.email,
          playerName: p.display_name || 'Player',
        }))

        const res = await fetch('/api/send-admin-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            recipients,
            subject,
            message,
            linkUrl: linkUrl || undefined,
            linkText: linkText || undefined,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          emailSuccess = data.sent
          emailFailed = data.failed
        }
      }
    }

    setSending(false)

    const parts: string[] = []
    if (sendAsNotification) parts.push(`${notifSuccess} Notification(s) Sent`)
    if (sendAsEmail) {
      parts.push(`${emailSuccess} Email(s) Sent${emailFailed > 0 ? `, ${emailFailed} Failed` : ''}${emailSkipped > 0 ? `, ${emailSkipped} Skipped (Not Opted In)` : ''}`)
    }
    setResult(parts.join(' • '))
  }

  if (loading || checking) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  if (!user || !isAdmin) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        <p>Access denied.</p>
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mail size={32} strokeWidth={2} color="#f0b429" />
          <span style={{ color: '#f0b429' }}>Message</span>{' '}
          <span style={{ color: '#ffffff' }}>Players</span>
        </h1>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '8px' }}>
            Recipients ({selectedIds.size} of {allProfiles.length} selected)
          </label>

  <select
    value={filterType}
    onChange={(e) => applyFilter(e.target.value)}
    style={{
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #2a2a3e',
      backgroundColor: '#12121a',
      color: '#ffffff',
      marginBottom: '10px'
    }}
  >
    <option value="all">Everyone</option>
    <option value="no-league">Not in Any League</option>
    <option value="hosts">League Hosts Only</option>
    <option value="tier-stowaway">Tier: Stowaway</option>
    <option value="tier-castaway">Tier: Castaway</option>
    <option value="tier-crewchief">Tier: Crew Chief</option>
    <option value="tier-teamprincipal">Tier: Team Principal</option>
    <option value="leaguetype-secrets-on-the-beach">League Type: Secrets on the Beach</option>
    <option value="leaguetype-uncharted-turretory">League Type: Uncharted Turretory</option>
  </select>

  <select
  value={filterType.startsWith('league-') ? filterType : ''}
  onChange={(e) => {
    if (e.target.value) applyFilter(e.target.value)
  }}
  style={{
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#12121a',
    color: '#ffffff',
    marginBottom: '18px',
    marginLeft: '8px'
  }}
>
  <option value="">Specific League</option>
  {allLeagues.map((league) => (
    <option key={league.id} value={`league-${league.id}`}>
      {league.name}
    </option>
  ))}
</select>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={selectAll} style={{ backgroundColor: 'transparent', color: '#f0b429', border: '1px solid #f0b429', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              Select All
            </button>
            <button onClick={clearAll} style={{ backgroundColor: 'transparent', color: '#a0a0b0', border: '1px solid #2a2a3e', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '8px' }}>
            {allProfiles.map((p) => (
              <label key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.user_id)}
                  onChange={() => toggleSelected(p.user_id)}
                />
                {p.display_name || 'Unnamed'} ({p.email})
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={sendAsNotification}
              onChange={(e) => setSendAsNotification(e.target.checked)}
            />
            Notification
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={sendAsEmail}
              onChange={(e) => setSendAsEmail(e.target.checked)}
            />
            Email
          </label>
        </div>

        <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '6px', border: '1px solid #2a2a3e', backgroundColor: '#12121a', color: '#ffffff' }}
        />

        <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: '100%', minHeight: '140px', padding: '10px', marginBottom: '16px', borderRadius: '6px', border: '1px solid #2a2a3e', backgroundColor: '#12121a', color: '#ffffff', fontFamily: 'inherit' }}
        />

        <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
          Link URL (optional)
        </label>
        <input
          type="text"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://trekkonleagues.com/..."
          style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '6px', border: '1px solid #2a2a3e', backgroundColor: '#12121a', color: '#ffffff' }}
        />

        <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
          Link Text (optional)
        </label>
        <input
          type="text"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          placeholder="View League →"
          style={{ width: '100%', padding: '10px', marginBottom: '24px', borderRadius: '6px', border: '1px solid #2a2a3e', backgroundColor: '#12121a', color: '#ffffff' }}
        />

        <button
          onClick={handleSend}
          disabled={sending}
          style={{ backgroundColor: '#f0b429', color: '#0a0a0f', padding: '14px 32px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: sending ? 'not-allowed' : 'pointer' }}
        >
          {sending ? 'Sending...' : 'Send Email'}
        </button>

        {result && (
          <p style={{ color: '#f0b429', fontWeight: 'bold', marginTop: '16px' }}>{result}</p>
        )}
      </div>
    </main>
  )
}