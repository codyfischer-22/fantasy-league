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
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'left'
      }}>
        <h3 style={{ color: '#f0b429', fontSize: '2rem', marginBottom: '12px' }}>
         🚧 Pardon our mess!
        </h3>
        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '8px', lineHeight: '1.6' }}>
          Please know, as we approach Survivor 51, we&apos;re actively polishing the mobile experience and building out chat and private league feature.</p>
        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
 <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '8px', lineHeight: '1.6' }}>We wanted to go live early, letting you sign up and share with friends before the season start. </p>
  Thanks for being here early! Definitely expect things to keep getting better!
        </p>
        <button onClick={handleDismiss} style={{
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
  )
}