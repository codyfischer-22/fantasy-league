'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'

// Master toggle to enable/disable the feature entirely
const MODAL_ENABLED = true 

// Bump this date/version string whenever you want the modal to show again after a new release
const UPDATE_VERSION = '2026-10-15' 

export default function PardonOurMessModal() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!MODAL_ENABLED) return

    // Check if the user has dismissed this specific version
    const seenVersion = localStorage.getItem('seenUpdateVersion')
    if (seenVersion !== UPDATE_VERSION) {
      setShowModal(true)
    }
  }, [])

  function handleCloseModal() {
    localStorage.setItem('seenUpdateVersion', UPDATE_VERSION)
    setShowModal(false)
  }

  if (!showModal || !MODAL_ENABLED) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'left',
        }}
      >
        <h3
          style={{
            color: '#f0b429',
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🔥 NEW FEATURES!
        </h3>

       <p
  style={{
    color: '#a0a0b0',
    fontSize: '0.95rem',
    marginBottom: '12px',
    lineHeight: '1.6',
  }}
>
  Check out our new social deduction game, <em>Trust Issue<span style={{ fontSize: '0.8em' }}>5</span></em>, to get in the games you've watched for so long!
</p>

          <p
          style={{
            color: '#a0a0b0',
            fontSize: '0.95rem',
            marginBottom: '12px',
            lineHeight: '1.6',
          }}
        >
<em>Trust Issue<span style={{ fontSize: '0.8em' }}>5</span></em> is a 5-round battle between good and evil factions, where you must correctly deduct who's who. Check out the new "Games" section to host or join a game!
        </p>

        <p
          style={{
            color: '#a0a0b0',
            fontSize: '0.95rem',
            marginBottom: '20px',
            lineHeight: '1.6',
          }}
        >
          For fantasy leagues, remember to make your weekly elimination predictions and know when to swap a player in the Trade Portal!
        </p>

        <button
          onClick={handleCloseModal}
          style={{
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '10px 28px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'block',
            margin: '0 auto',
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  )
}