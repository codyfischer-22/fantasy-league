'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MobileNav from '@/components/MobileNav'

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

return (
  <>
    {!isMobileWidth && <Header />}
  <div style={{ flex: isMobileWidth ? '0 0 auto' : 1, paddingBottom: 0 }}>
  {children}
</div>
    <Footer />
    {isMobileWidth && <MobileNav />}
  </>
)
}