'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'

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
          You have until Tuesday, September 15, 11:59 PM to sign up for our public <em>Survivor</em> and <em>Traitors</em> leagues. To confirm you are in, check under "Your Leagues" in Leagues.</p>
        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '8px', lineHeight: '1.6' }}>
Keep an eye out for next steps on the draft process. In the meantime, share a league with your tribe and prepare for the trek!
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