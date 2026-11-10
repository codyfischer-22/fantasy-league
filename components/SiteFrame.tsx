'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MobileNav from '@/components/MobileNav'
import PardonOurMessModal from '@/components/PardonOurMessModal'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const [isMobileWidth, setIsMobileWidth] = useState(false)

  useEffect(() => {
    function checkWidth() {
      setIsMobileWidth(window.innerWidth <= 600)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

    const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    const key = `lastSeen:${user.id}`
    try {
      if (localStorage.getItem(key) === today) return
    } catch {}
    supabase.rpc('touch_last_seen').then(({ error }) => {
      if (!error) {
        try { localStorage.setItem(key, today) } catch {}
      }
    })
  }, [user])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isMobileWidth && <Header />}
      <PardonOurMessModal />
   <div className="site-content-wrap" style={{ flex: 1 }}>
  {children}
</div>
      <Footer />
      {isMobileWidth && <MobileNav />}
    </div>
  )
}