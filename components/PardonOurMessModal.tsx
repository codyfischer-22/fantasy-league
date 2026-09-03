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
        <h3 style={{ color: '#f0b429', fontSize: 'clamp(1.5rem, 6vw, 2rem)', marginBottom: '12px' }}>
         🔥 ALMOST GO TIME!
        </h3>
        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '8px', lineHeight: '1.6' }}>
          We&apos;re mobile-friendly now, and we&apos;ll continue to improve!</p>
        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '8px', lineHeight: '1.6' }}>
Now it's time to fill leagues before the Survivor 51 Premiere! <strong>Can you share this link with friends?</strong>
</p>
<p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '12px', lineHeight: '1.6' }}>
  Get ready for a fun trek with friends!
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