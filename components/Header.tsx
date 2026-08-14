'use client'

import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Notification = {
  id: number
  message: string
  link: string | null
  is_read: boolean
}

export default function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

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

      setNotifications(data ?? [])
    }

    loadNotifications()
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
      padding: '20px 40px',
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
      <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <a href="/#tiers" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.1rem' }}>Pricing</a>
        <a href="/leagues-overview" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.2rem' }}>Leagues</a>
        <a href="mailto:codyray.fischer@gmail.com" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.1rem' }}>Contact</a>
        <a style={{ color: '#302e2b', textDecoration: 'none', fontSize: '1.1rem' }}>Extras</a>

        {isAdmin && (
          <a href="/admin/scoring" className="btn" style={{ color: '#ff6b6b', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
            ⚙️
          </a>
        )}

        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
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
                        className="btn" style={{
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

        {loading ? null : user ? (
          <>
            <a href="/account" className="btn" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '1.1rem' }}>My Account</a>
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
    </header>
  )
}