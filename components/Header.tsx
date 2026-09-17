'use client'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import ChatPanel from '@/components/ChatPanel'
import { MessageCircle, Bell, Settings, Menu, Mail, HandCoins, UserPen } from 'lucide-react'

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
  const notifRef = useRef<HTMLDivElement | null>(null)
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false)
const hamburgerRef = useRef<HTMLDivElement | null>(null)

useEffect(() => {
  function handleClickOutsideHamburger(e: MouseEvent) {
    if (hamburgerRef.current && !hamburgerRef.current.contains(e.target as Node)) {
      setShowHamburgerMenu(false)
    }
  }
  if (showHamburgerMenu) {
    document.addEventListener('mousedown', handleClickOutsideHamburger)
  }
  return () => document.removeEventListener('mousedown', handleClickOutsideHamburger)
}, [showHamburgerMenu])

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
      .select('is_global_admin, is_league_admin')
      .eq('user_id', user.id)
      .single()
    setIsAdmin((data?.is_global_admin || data?.is_league_admin) ?? false)
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
          Choose Fandoms. Draft Teams. Beat Buddies.
        </p>
      </a>

      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
<a href="/#leagues" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.2rem' }}>Leagues</a>         <a href="/#tiers" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.1rem' }}>Features</a>
<a href="/leagues/all/rules" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.1rem' }}>Scoring</a>
<a href="/leagues/all/draft" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.1rem' }}>Timelines</a>

<div ref={hamburgerRef} style={{ position: 'relative' }}>
  <button
    onClick={() => {
      setShowHamburgerMenu(!showHamburgerMenu)
      setShowNotifications(false)
      setIsChatOpen(false)
    }}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center'
    }}
  >
    <Menu size={24} strokeWidth={2} />
  </button>

  {showHamburgerMenu && (
    <div style={{
      position: 'absolute',
      top: '36px',
      right: 0,
      backgroundColor: '#1a1a2e',
      border: '1px solid #f0b429',
      borderRadius: '10px',
      minWidth: '220px',
      zIndex: 200,
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      {user && (
        <a href="/account" style={{
          padding: '10px 12px',
          textDecoration: 'none',
          color: '#ffffff',
          fontSize: '1rem',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <UserPen size={20} strokeWidth={1.5} /> My Account
        </a>
      )}
      <a href="/contact" style={{
        padding: '10px 12px',
        textDecoration: 'none',
        color: '#ffffff',
        fontSize: '1rem',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Mail size={20} strokeWidth={1.5} /> Contact Us
      </a>
      <a href="/tip-jar" style={{
        padding: '10px 12px',
        textDecoration: 'none',
        color: '#ffffff',
        fontSize: '1rem',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <HandCoins size={22} strokeWidth={1.5} /> Support Trekkon
      </a>
      {isAdmin && (
        <a href="/admin/dashboard" style={{
          padding: '10px 12px',
          textDecoration: 'none',
          color: '#ffffff',
          fontSize: '1rem',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Settings size={20} strokeWidth={1.5} /> Admin Dashboard
        </a>
      )}
    </div>
  )}
</div>

        {loading ? null : user ? (
          <>
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
    color: '#ffffff',
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  }}
>
  <MessageCircle size={24} strokeWidth={2} />
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
    position: 'relative',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center'
  }}
>
  <Bell size={24} strokeWidth={2} />
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
  <div ref={notifRef} className="mobile-notif-panel" style={{
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

      {isChatOpen && (
        <ChatPanel onClose={() => setIsChatOpen(false)} />
      )}
    </header>
  )
}