'use client'

import { useEffect, useState } from 'react'

export default function PardonOurMessModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('pardonOurMessDismissed')
    if (!dismissed) {
      setShow(true)
    }
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem('pardonOurMessDismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200
    }}>
      <div style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'left'
      }}>
        <h3 style={{ color: '#f0b429', fontSize: '2rem', marginBottom: '12px' }}>
         🚧 Pardon our mess!
        </h3>
        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '8px', lineHeight: '1.6' }}>
          Thanks for patience with our ongoing efforts to improve this site.</p>
        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '8px', lineHeight: '1.6' }}>
  As we approach Survivor 51, please know we&apos;re actively polishing the mobile experience and building out additional features.
</p>
<p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '12px', lineHeight: '1.6' }}>
  Let us know if there&apos;s something we&apos;re missing!
</p>
     <button onClick={handleDismiss} style={{
  backgroundColor: '#f0b429',
  color: '#0a0a0f',
  padding: '10px 28px',
  borderRadius: '6px',
  border: 'none',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  cursor: 'pointer',
  display: 'block',    // Converts button to block element
  margin: '0 auto'     // Centers block element horizontally
}}>
  Got it!
</button>
      </div>
    </div>
  )
}