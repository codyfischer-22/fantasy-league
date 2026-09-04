'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import ChatPanel from '@/components/ChatPanel'

export default function MobileNav() {
  const { user } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [hasUnreadChat, setHasUnreadChat] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<{ id: number; message: string; link: string | null; is_read: boolean }[]>([])
  const notifRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function loadNotifications() {
      if (!user) {
        setNotifications([])
        return
      }
      const { data } = await supabase
        .from('notifications')
        .select('id, message, link, is_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      const fresh = data ?? []
      setNotifications(fresh)
      setUnreadCount(fresh.filter((n) => !n.is_read).length)
    }
    loadNotifications()
    const interval = setInterval(loadNotifications, 8000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    async function checkUnreadChat() {
      if (!user) {
        setHasUnreadChat(false)
        return
      }
      const { data: memberRows } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', user.id)
      const leagueIds = (memberRows ?? []).map((r) => r.league_id)
      if (leagueIds.length === 0) {
        setHasUnreadChat(false)
        return
      }
      const { data: readRows } = await supabase
        .from('chat_read_status')
        .select('league_id, last_read_at')
        .eq('user_id', user.id)
        .in('league_id', leagueIds)
      const readMap: Record<number, string> = {}
      ;(readRows ?? []).forEach((r) => { readMap[r.league_id] = r.last_read_at })
      const { data: msgRows } = await supabase
        .from('messages')
        .select('league_id, created_at')
        .in('league_id', leagueIds)
        .order('created_at', { ascending: false })
      const latestByLeague: Record<number, string> = {}
      ;(msgRows ?? []).forEach((m) => {
        if (!latestByLeague[m.league_id]) latestByLeague[m.league_id] = m.created_at
      })
      let anyUnread = false
      for (const leagueId of leagueIds) {
        const latest = latestByLeague[leagueId]
        if (!latest) continue
        const lastRead = readMap[leagueId]
        if (!lastRead || new Date(latest) > new Date(lastRead)) {
          anyUnread = true
          break
        }
      }
      setHasUnreadChat(anyUnread)
    }
    checkUnreadChat()
    const interval = setInterval(checkUnreadChat, 8000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const markAsRead = async (id: number) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const deleteNotification = async (id: number) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setUnreadCount((prev) => {
      const wasUnread = notifications.find((n) => n.id === id && !n.is_read)
      return wasUnread ? Math.max(0, prev - 1) : prev
    })
  }

  const navItemStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#f0b429',
    fontSize: '1.3rem',
    cursor: 'pointer',
    position: 'relative',
    padding: '4px',
    flex: 1,
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px'
  }

  const navLabelStyle: React.CSSProperties = {
    fontSize: '0.6rem',
    color: '#a0a0b0',
    fontWeight: 'normal'
  }

  return (
    <>
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#12121a',
        borderTop: '2px solid #f0b429',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 4px',
        zIndex: 150
      }}>
        <a href="/" style={navItemStyle}>
          <span>🏠</span>
          <span style={navLabelStyle}>Home</span>
        </a>
        <a href="/leagues-overview" style={navItemStyle}>
          <span>🧭</span>
          <span style={navLabelStyle}>Leagues</span>
        </a>
        {user && (
          <button
            onClick={() => { setIsChatOpen(!isChatOpen); setShowNotifications(false) }}
            style={navItemStyle}
          >
            <span style={{ position: 'relative' }}>
              💬
              {hasUnreadChat && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#f0b429'
                }} />
              )}
            </span>
            <span style={navLabelStyle}>Chat</span>
          </button>
        )}
        {user && (
          <button
            onClick={() => { setShowNotifications(!showNotifications); setIsChatOpen(false) }}
            style={navItemStyle}
          >
            <span style={{ position: 'relative' }}>
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  backgroundColor: '#ff6b6b',
                  color: '#ffffff',
                  borderRadius: '50%',
                  fontSize: '0.6rem',
                  fontWeight: 'bold',
                  padding: '1px 4px',
                  minWidth: '14px',
                  textAlign: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </span>
            <span style={navLabelStyle}>Alerts</span>
          </button>
        )}
        <a href={user ? '/account' : '/login'} style={navItemStyle}>
          <span>{user ? '👤' : '🔑'}</span>
          <span style={navLabelStyle}>{user ? 'Account' : 'Sign In'}</span>
        </a>
      </nav>

      {showNotifications && (
        <div ref={notifRef} className="mobile-notif-panel" style={{
          position: 'fixed',
          bottom: '56px',
          left: '8px',
          right: '8px',
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '10px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 200,
          padding: '8px'
        }}>
          {notifications.length === 0 ? (
            <p style={{ color: '#555570', fontSize: '0.9rem', padding: '4px', textAlign: 'center' }}>
              No notifications saved.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  position: 'relative',
                  borderRadius: '6px',
                  backgroundColor: n.is_read ? 'transparent' : '#12121a',
                  marginBottom: '4px'
                }}
              >
                <a
                  href={n.link ?? '#'}
                  onClick={() => markAsRead(n.id)}
                  style={{
                    display: 'block',
                    padding: '10px 32px 10px 12px',
                    textDecoration: 'none',
                    color: n.is_read ? '#a0a0b0' : '#ffffff',
                    fontSize: '0.85rem'
                  }}
                >
                  {n.message}
                </a>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    deleteNotification(n.id)
                  }}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#555570',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
    </>
  )
}