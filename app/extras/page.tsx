'use client'
import { useAuth } from '@/lib/AuthContext'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function ExtrasContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const justTipped = searchParams.get('tipped') === 'true'
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5)
  const [customAmount, setCustomAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const presetAmounts = [5, 10, 25]

  const handleTip = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount
    if (!amount || amount < 1) return
    setSubmitting(true)
    const res = await fetch('/api/tip-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, email: user?.email }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Something went wrong. Please try again.')
    }
  }

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '60px 40px'
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <a href="/" style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to Trekkon Fantasy Leagues
        </a>

<h1 style={{ fontSize: '2.25rem', marginBottom: '4px' }}>
        🔧<span style={{ color: '#f0b429' }}>Trekkon</span>{' '}
        <span style={{ color: '#ffffff' }}>Extras</span>
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '30px', lineHeight: '1.6' }}>
          As time goes on, keep an eye out for locally-sourced podcasts, blogs, special offers, and other fun features! In the meantime, consider a tip below!
        </p>

     {justTipped && (
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
      padding: '20px',
      maxWidth: '380px',
      textAlign: 'left'
    }}>
      <h3 style={{ color: '#f0b429', fontSize: '1.6rem', marginBottom: '12px' }}>
        ⚜️ Thanks for your support!
      </h3>
      <p style={{ color: '#a0a0b0', fontSize: '1rem', marginBottom: '24px', lineHeight: '1.6' }}>
        Trekkon Fantasy Leagues could not continue without the patronage of league members like you! Now get out there and trek on!
      </p>
      <button
        onClick={() => window.history.replaceState(null, '', '/extras')}
        style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '10px 28px',
          borderRadius: '6px',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          cursor: 'pointer'
        }}
      >
        You're welcome!
      </button>
    </div>
  </div>
)}

        <div style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '12px',
          padding: '28px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#f0b429', fontSize: '1.4rem', marginBottom: '8px' }}>
            💰 Tip Jar
          </h2>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.6' }}>
            What began as a hobby project turned into hundreds of hours of late-night coding and paying for various website hosting tools. Consider a one-time tip to help cover your league, support the platform, and keep the trek going!
        </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}
                style={{
                  backgroundColor: selectedAmount === amt && !customAmount ? '#f0b429' : 'transparent',
                  color: selectedAmount === amt && !customAmount ? '#0a0a0f' : '#f0b429',
                  border: '1px solid #f0b429',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                ${amt}
              </button>
            ))}
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Custom"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
              style={{
                width: '100px',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2a2a3e',
                backgroundColor: '#12121a',
                color: '#ffffff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <button
            onClick={handleTip}
            disabled={submitting || (!selectedAmount && !customAmount)}
            style={{
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '12px 28px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Redirecting...' : 'Leave a Tip →'}
          </button>

          <p style={{ color: '#555570', fontSize: '0.85rem', marginTop: '16px' }}>
            Please note tips are non-refundable and separate from any membership subscription.
          </p>
        </div>

      </div>
    </main>
  )
}

export default function Extras() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: '#0a0a0f', minHeight: '100vh' }} />}>
      <ExtrasContent />
    </Suspense>
  )
}