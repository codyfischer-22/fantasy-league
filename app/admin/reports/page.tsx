'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { MessageSquareWarning } from 'lucide-react'

type Report = {
  id: string
  message_id: string
  league_id: number | null
  league_name: string | null
  reporter_id: string
  reported_user_id: string
  message_content: string
  message_created_at: string | null
  reason: string
  status: 'open' | 'dismissed' | 'resolved'
  handled_by: string | null
  handled_at: string | null
  created_at: string
}

export default function ReportedMessagesPage() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'open' | 'handled'>('open')
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const loadReports = async () => {
    const { data } = await supabase
      .from('chat_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    const rows = (data ?? []) as Report[]
    setReports(rows)

    const ids = [...new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id, r.handled_by].filter((id): id is string => !!id)))]
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', ids)
      const map: Record<string, string> = {}
      ;(profs ?? []).forEach((p) => { map[p.user_id] = p.display_name || 'Unnamed Player' })
      setNames(map)
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
        await loadReports()
      }
      setChecking(false)
    }
    if (!loading) checkAdmin()
  }, [user, loading])

  const handleAction = async (id: string, status: 'dismissed' | 'resolved') => {
    if (!user) return
    setWorkingId(id)
    setNote('')
    const { error, count } = await supabase
      .from('chat_reports')
      .update(
        { status, handled_by: user.id, handled_at: new Date().toISOString() },
        { count: 'exact' }
      )
      .eq('id', id)
      .eq('status', 'open')
    setWorkingId(null)
    if (error || !count) {
      setNote('Could not update this report. It may have already been handled.')
      return
    }
    await loadReports()
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

  const open = reports.filter((r) => r.status === 'open')
  const handled = reports.filter((r) => r.status !== 'open')
  const visible = tab === 'open' ? open : handled

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/admin/dashboard" style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Back to Admin Dashboard
        </a>

        <h1 style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquareWarning size={32} strokeWidth={2} color="#f0b429" />
          <span style={{ color: '#f0b429' }}>Support</span>{' '}
          <span style={{ color: '#ffffff' }}>Center</span>
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px' }}>
          Chat messages flagged by players. Marking a report handled only changes its status. It does not delete the message or take action on the player.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['open', 'handled'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                backgroundColor: tab === t ? '#f0b429' : 'transparent',
                color: tab === t ? '#0a0a0f' : '#a0a0b0',
                border: '1px solid #f0b429',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {t === 'open' ? `Open (${open.length})` : `Handled (${handled.length})`}
            </button>
          ))}
        </div>

        {note && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '12px' }}>{note}</p>}

        {visible.length === 0 ? (
          <p style={{ color: '#555570' }}>{tab === 'open' ? 'No open reports.' : 'Nothing handled yet.'}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visible.map((r) => (
              <div key={r.id} style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '16px 18px' }}>
                <div style={{ color: '#555570', fontSize: '0.8rem', marginBottom: '8px' }}>
                  {r.league_name ?? 'Deleted league'} • {new Date(r.created_at).toLocaleString()}
                </div>

                <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span style={{ color: '#a0a0b0' }}>Reported player: </span>
                  <strong>{names[r.reported_user_id] ?? 'Unknown'}</strong>
                </div>
                <div style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '10px 12px', color: '#e0e0e8', fontSize: '0.9rem', whiteSpace: 'pre-line', marginBottom: '10px' }}>
                  {r.message_content}
                </div>

                <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span style={{ color: '#a0a0b0' }}>Reported by: </span>
                  <strong>{names[r.reporter_id] ?? 'Unknown'}</strong>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#f0b429', marginBottom: '12px' }}>
                  &quot;{r.reason}&quot;
                </div>

                {r.status === 'open' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAction(r.id, 'resolved')}
                      disabled={workingId === r.id}
                      style={{ backgroundColor: '#068e38', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'dismissed')}
                      disabled={workingId === r.id}
                      style={{ backgroundColor: 'transparent', color: '#a0a0b0', border: '1px solid #2a2a3e', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#555570', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                    {r.status} by {r.handled_by ? (names[r.handled_by] ?? 'Admin') : 'Admin'}
                    {r.handled_at ? ` • ${new Date(r.handled_at).toLocaleString()}` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}