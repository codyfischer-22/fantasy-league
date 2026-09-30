'use client'

import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { MessageSquareWarning } from 'lucide-react'

type Report = {
  id: string
  message_id: string
  league_id: number | null
  league_name: string | null
  reporter_id: string
  reported_user_id: string
  message_content: string
  reason: string
  status: 'open' | 'dismissed' | 'resolved'
  handled_by: string | null
  handled_at: string | null
  created_at: string
}

type Submission = {
  id: string
  name: string
  email: string
  reason: string
  message: string
  status: 'open' | 'dismissed' | 'resolved'
  handled_by: string | null
  handled_at: string | null
  created_at: string
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    }>
      <InboxContent />
    </Suspense>
  )
}

function InboxContent() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const searchParams = useSearchParams()
  const [category, setCategory] = useState<'reports' | 'contact'>(
    searchParams.get('tab') === 'contact' ? 'contact' : 'reports'
  )
  const [tab, setTab] = useState<'open' | 'handled'>('open')

  const [reports, setReports] = useState<Report[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
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
      setNames((prev) => ({ ...prev, ...map }))
    }
  }

  const loadSubmissions = async () => {
    const { data } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    const rows = (data ?? []) as Submission[]
    setSubmissions(rows)

    const ids = [...new Set(rows.map((s) => s.handled_by).filter((id): id is string => !!id))]
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', ids)
      const map: Record<string, string> = {}
      ;(profs ?? []).forEach((p) => { map[p.user_id] = p.display_name || 'Admin' })
      setNames((prev) => ({ ...prev, ...map }))
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
        await Promise.all([loadReports(), loadSubmissions()])
      }
      setChecking(false)
    }
    if (!loading) checkAdmin()
  }, [user, loading])

  const handleReportAction = async (id: string, status: 'dismissed' | 'resolved') => {
    if (!user) return
    setWorkingId(id)
    setNote('')
    const { error, count } = await supabase
      .from('chat_reports')
      .update({ status, handled_by: user.id, handled_at: new Date().toISOString() }, { count: 'exact' })
      .eq('id', id)
      .eq('status', 'open')
    setWorkingId(null)
    if (error || !count) {
      setNote('Could not update this report. It may have already been handled.')
      return
    }
    await loadReports()
  }

  const handleSubmissionAction = async (id: string, status: 'dismissed' | 'resolved') => {
    if (!user) return
    setWorkingId(id)
    setNote('')
    const { error, count } = await supabase
      .from('contact_submissions')
      .update({ status, handled_by: user.id, handled_at: new Date().toISOString() }, { count: 'exact' })
      .eq('id', id)
      .eq('status', 'open')
    setWorkingId(null)
    if (error || !count) {
      setNote('Could not update this submission. It may have already been handled.')
      return
    }
    await loadSubmissions()
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

  const openReports = reports.filter((r) => r.status === 'open')
  const handledReports = reports.filter((r) => r.status !== 'open')
  const openSubmissions = submissions.filter((s) => s.status === 'open')
  const handledSubmissions = submissions.filter((s) => s.status !== 'open')

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/admin/dashboard" style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Back to Admin Dashboard
        </a>

       <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <MessageSquareWarning size={36} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '0px' }} />
  <span style={{ color: '#f0b429' }}>Support Center</span>{' '}
  <span style={{ color: '#ffffff' }}>Inbox</span>
</h1>
      <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '32px' }}>
Your handling center for and archive of contact/support inquiries and reported chat messages.
</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {(['reports', 'contact'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                backgroundColor: category === c ? '#f0b429' : 'transparent',
                color: category === c ? '#0a0a0f' : '#a0a0b0',
                border: '1px solid #f0b429',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {c === 'reports' ? `Reported Messages (${openReports.length})` : `Contact Form (${openSubmissions.length})`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['open', 'handled'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                backgroundColor: tab === t ? '#2a2a3e' : 'transparent',
                color: tab === t ? '#ffffff' : '#555570',
                border: '1px solid #2a2a3e',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {t === 'open' ? 'Open' : 'Handled'}
            </button>
          ))}
        </div>

        {note && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '12px' }}>{note}</p>}

        {category === 'reports' ? (
          (tab === 'open' ? openReports : handledReports).length === 0 ? (
            <p style={{ color: '#555570' }}>{tab === 'open' ? 'No open reports.' : 'Nothing handled yet.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(tab === 'open' ? openReports : handledReports).map((r) => (
                <div key={r.id} style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '16px 18px' }}>
                  <div style={{ color: '#555570', fontSize: '0.8rem', marginBottom: '8px' }}>
                    {r.league_name ?? 'Deleted league'} • {new Date(r.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                    <span style={{ color: '#a0a0b0' }}>Reported Player: </span>
                    <strong>{names[r.reported_user_id] ?? 'Unknown'}</strong>
                  </div>
                  <div style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '10px 12px', color: '#e0e0e8', fontSize: '0.9rem', whiteSpace: 'pre-line', marginBottom: '10px' }}>
                    {r.message_content}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                    <span style={{ color: '#a0a0b0' }}>Reported by: </span>
                    <strong>{names[r.reporter_id] ?? 'Unknown'}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#f0b429', marginBottom: '12px' }}>&quot;{r.reason}&quot;</div>

                  {r.status === 'open' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleReportAction(r.id, 'resolved')} disabled={workingId === r.id} style={{ backgroundColor: '#068e38', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Mark Resolved
                      </button>
                      <button onClick={() => handleReportAction(r.id, 'dismissed')} disabled={workingId === r.id} style={{ backgroundColor: 'transparent', color: '#a0a0b0', border: '1px solid #2a2a3e', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: '#555570', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                      {r.status} by {r.handled_by ? (names[r.handled_by] ?? 'Admin') : 'Admin'}
                      {r.handled_at ? ` • ${new Date(r.handled_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          (tab === 'open' ? openSubmissions : handledSubmissions).length === 0 ? (
            <p style={{ color: '#555570' }}>{tab === 'open' ? 'No open submissions.' : 'Nothing handled yet.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(tab === 'open' ? openSubmissions : handledSubmissions).map((s) => (
                <div key={s.id} style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '16px 18px' }}>
                  <div style={{ color: '#555570', fontSize: '0.8rem', marginBottom: '8px' }}>
                    {s.reason} • {new Date(s.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                    <strong>{s.name}</strong> <span style={{ color: '#555570' }}>({s.email})</span>
                  </div>
                  <div style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '10px 12px', color: '#e0e0e8', fontSize: '0.9rem', whiteSpace: 'pre-line', marginBottom: '10px' }}>
                    {s.message}
                  </div>

                  {s.status === 'open' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleSubmissionAction(s.id, 'resolved')} disabled={workingId === s.id} style={{ backgroundColor: '#068e38', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Mark Resolved
                      </button>
                      <button onClick={() => handleSubmissionAction(s.id, 'dismissed')} disabled={workingId === s.id} style={{ backgroundColor: 'transparent', color: '#a0a0b0', border: '1px solid #2a2a3e', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: '#555570', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                      {s.status} by {s.handled_by ? (names[s.handled_by] ?? 'Admin') : 'Admin'}
                      {s.handled_at ? ` • ${new Date(s.handled_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  )
}