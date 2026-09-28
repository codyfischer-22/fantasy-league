'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { Mail } from 'lucide-react'

type AdminMessage = {
  id: string
  sent_by: string
  subject: string
  message: string
  link_url: string | null
  link_text: string | null
  recipient_count: number
  audience_label: string | null
  via_notification: boolean
  via_email: boolean
  status: 'scheduled' | 'sent' | 'canceled' | 'failed'
  scheduled_for: string | null
  sent_at: string | null
  notif_sent: number | null
  email_sent: number | null
  email_failed: number | null
  email_skipped: number | null
  created_at: string
}

export default function MessageHistoryPage() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [senderNames, setSenderNames] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'scheduled' | 'sent'>('scheduled')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const loadMessages = async () => {
    const { data } = await supabase
      .from('admin_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    const rows = (data ?? []) as AdminMessage[]
    setMessages(rows)

    const senderIds = [...new Set(rows.map((m) => m.sent_by))]
    if (senderIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', senderIds)
      const map: Record<string, string> = {}
      ;(profs ?? []).forEach((p) => { map[p.user_id] = p.display_name || 'Admin' })
      setSenderNames(map)
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
        await loadMessages()
      }
      setChecking(false)
    }
    if (!loading) checkAdmin()
  }, [user, loading])

  const handleCancel = async (id: string) => {
    setCancelingId(id)
    setNote('')
    const { error, count } = await supabase
      .from('admin_messages')
      .update({ status: 'canceled' }, { count: 'exact' })
      .eq('id', id)
      .eq('status', 'scheduled')
    setCancelingId(null)
    if (error || !count) {
      setNote('Could not cancel. It may have already gone out.')
      return
    }
    await loadMessages()
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

  const scheduled = messages
    .filter((m) => m.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_for ?? 0).getTime() - new Date(b.scheduled_for ?? 0).getTime())
  const past = messages.filter((m) => m.status !== 'scheduled')
  const visible = tab === 'scheduled' ? scheduled : past

  const statusColor = (s: string) =>
    s === 'sent' ? '#068e38' : s === 'scheduled' ? '#f0b429' : s === 'failed' ? '#ff6b6b' : '#555570'

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/admin/message-players" style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Back to Message Players
        </a>

        <h1 style={{ fontSize: '2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mail size={32} strokeWidth={2} color="#f0b429" />
          <span style={{ color: '#f0b429' }}>Outgoing</span>{' '}
          <span style={{ color: '#ffffff' }}>Messages</span>
        </h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['scheduled', 'sent'] as const).map((t) => (
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
              {t === 'scheduled' ? `Scheduled (${scheduled.length})` : `Sent (${past.length})`}
            </button>
          ))}
        </div>

        {note && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '12px' }}>{note}</p>}

        {visible.length === 0 ? (
          <p style={{ color: '#555570' }}>Nothing here yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visible.map((m) => {
              const when = m.status === 'scheduled' ? m.scheduled_for : (m.sent_at ?? m.created_at)
              const expanded = expandedId === m.id
              return (
                <div key={m.id} style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold' }}>{m.subject}</div>
                      <div style={{ color: '#555570', fontSize: '0.8rem', marginTop: '2px' }}>
                        {m.audience_label ?? 'Custom Selection'} • {m.recipient_count} recipient{m.recipient_count === 1 ? '' : 's'} •{' '}
                        {[m.via_notification && 'Notification', m.via_email && 'Email'].filter(Boolean).join(' + ')} •{' '}
                        {when ? new Date(when).toLocaleString() : ''} • by {senderNames[m.sent_by] ?? 'Admin'}
                      </div>
                      {m.status === 'sent' && (
                        <div style={{ color: '#a0a0b0', fontSize: '0.8rem', marginTop: '2px' }}>
                          {m.via_notification && `${m.notif_sent ?? 0} notifications`}
                          {m.via_notification && m.via_email && ' • '}
                          {m.via_email && `${m.email_sent ?? 0} emails sent${m.email_failed ? `, ${m.email_failed} failed` : ''}${m.email_skipped ? `, ${m.email_skipped} skipped` : ''}`}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: statusColor(m.status), fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize' }}>{m.status}</span>
                      {m.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancel(m.id)}
                          disabled={cancelingId === m.id}
                          style={{ backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          {cancelingId === m.id ? 'Canceling...' : 'Cancel'}
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(expanded ? null : m.id)}
                        style={{ background: 'none', border: 'none', color: '#a0a0b0', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {expanded ? 'Hide' : 'View'}
                      </button>
                    </div>
                  </div>
                  {expanded && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #2a2a3e', color: '#a0a0b0', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                      {m.message}
                      {m.link_url && (
                        <div style={{ marginTop: '8px', color: '#555570', fontSize: '0.8rem' }}>
                          Link: {m.link_text ?? ''} {m.link_url}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}