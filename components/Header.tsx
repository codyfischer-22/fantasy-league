'use client'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import ChatPanel from '@/components/ChatPanel'

type Notification = {
  id: number
  message: string
  link: string | null
  is_read: boolean
}

export default function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showExtrasModal, setShowExtrasModal] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const previousUnreadCountRef = useRef<number | null>(null)
  const dingAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [hasUnreadChat, setHasUnreadChat] = useState(false)

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
    dingAudioRef.current = new Audio('/sounds/notification-ding.mp3')
  }, [])

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

      const freshNotifications = data ?? []
      setNotifications(freshNotifications)

      const freshUnreadCount = freshNotifications.filter((n) => !n.is_read).length
      if (
        previousUnreadCountRef.current !== null &&
        freshUnreadCount > previousUnreadCountRef.current
      ) {
        dingAudioRef.current?.play().catch(() => {})
      }

      previousUnreadCountRef.current = freshUnreadCount
    }

    loadNotifications()
    const pollInterval = setInterval(loadNotifications, 8000)
    return () => clearInterval(pollInterval)
  }, [user])

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_global_admin')
        .eq('user_id', user.id)
        .single()
      setIsAdmin(data?.is_global_admin ?? false)
    }
    checkAdmin()
  }, [user])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = async (id: number) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  const deleteNotification = async (id: number) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header style={{
      backgroundColor: '#12121a',
      borderBottom: '2px solid #f0b429',
      padding: '16px 20px',
      flexWrap: 'wrap',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <a href="/" style={{ textDecoration: 'none' }}>
        <h1 style={{
          color: '#f0b429',
          fontSize: '2rem',
          margin: 0,
          letterSpacing: '2px',
          fontWeight: 'bold'
        }}>
          ⚜️ Trekkon Fantasy Leagues
        </h1>
        <p style={{
          color: '#a0a0b0',
          margin: '4px 0 0 0',
          fontSize: '1.0rem',
          letterSpacing: '.9px'
        }}>
          Gather Buddies. Draft Teams. Make History.
        </p>
      </a>

      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <a href="/#tiers" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.1rem' }}>Pricing</a>
        <a href="/leagues-overview" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.2rem' }}>Leagues</a>
        <a href="/contact" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.1rem' }}>Contact</a>

        <button
          onClick={() => setShowExtrasModal(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#f0b429',
            textDecoration: 'none',
            fontSize: '1.1rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0
          }}
        >
          Extras
        </button>

        {loading ? null : user ? (
          <>
            <a href="/account" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.1rem' }}>Account</a>

            {user && (
              <button
                onClick={() => {
                  setIsChatOpen(!isChatOpen)
                  setShowNotifications(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.3rem',
                  color: '#f0b429',
                  position: 'relative'
                }}
              >
                💬
                {hasUnreadChat && (
                  <span
                    className="chat-unread-dot"
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#f0b429'
                    }}
                  />
                )}
              </button>
            )}

            {user && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setIsChatOpen(false)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.3rem',
                    position: 'relative',
                    color: '#f0b429'
                  }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-6px',
                      backgroundColor: '#ff6b6b',
                      color: '#ffffff',
                      borderRadius: '50%',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      padding: '2px 5px',
                      minWidth: '16px',
                      textAlign: 'center'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    top: '36px',
                    right: 0,
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #f0b429',
                    borderRadius: '10px',
                    width: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 200,
                    padding: '8px'
                  }}>
                    {notifications.length === 0 ? (
                      <p style={{ color: '#555570', fontSize: '1rem', padding: '4px', textAlign: 'center' }}>
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
                            className="btn"
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
              </div>
            )}

            {isAdmin && (
              <a href="/admin/scoring" className="btn" style={{ color: '#ff6b6b', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
                ⚙️
              </a>
            )}
            <button onClick={handleSignOut} style={{
              backgroundColor: 'transparent',
              color: '#f0b429',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #f0b429',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}>Sign Out</button>
          </>
        ) : (
          <a href="/login" className="btn" style={{
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '8px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.0rem'
          }}>Sign In</a>
        )}
      </nav>

      {showExtrasModal && (
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
            border: '1px solid #f0b429',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '380px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#f0b429', fontSize: '2rem', textAlign: 'left', marginBottom: '12px' }}>
              🔧 Coming soon!
            </h3>
            <p style={{ color: '#a0a0b0', fontSize: '1rem', textAlign: 'left', marginBottom: '24px', lineHeight: '1.6' }}>
              Stay tuned for extra features like regular blog posts, special offers, and more!
            </p>
            <button onClick={() => setShowExtrasModal(false)} style={{
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '10px 28px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              Got it!
            </button>
          </div>
        </div>
      )}

      {isChatOpen && (
        <ChatPanel onClose={() => setIsChatOpen(false)} />
      )}
    </header>
  )
}