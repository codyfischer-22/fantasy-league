'use client'
import { useAuth } from '@/lib/AuthContext'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { HandCoins } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

function ExtrasContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const justTipped = searchParams.get('tipped') === 'true'
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5)
  const [customAmount, setCustomAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showName, setShowName] = useState(true)
  const [publicName, setPublicName] = useState('')
  const [supporters, setSupporters] = useState<{ public_name: string; created_at: string; amount_cents: number }[]>([])

  useEffect(() => {
    async function load() {
      if (user) {
        const { data } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).single()
        if (data?.display_name) setPublicName((prev) => prev || data.display_name)
      }
      const { data: rows } = await supabase
        .from('supporters')
        .select('public_name, created_at, amount_cents')
        .order('created_at', { ascending: false })
        .limit(50)
      setSupporters(rows ?? [])
    }
    load()
  }, [user])


  const presetAmounts = [5, 10, 25]

  const handleTip = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount
    if (!amount || amount < 1) return
    setSubmitting(true)
    const res = await fetch('/api/tip-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, email: user?.email, showName, publicName }),
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
    <main className="mobile-shrink-main trekkon-bg" style={{
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
          marginBottom: '24px',
        }}>
          ← Back to Trekkon Fantasy Leagues
        </a>

<h1 style={{ fontSize: '2.25rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <HandCoins size={38} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '0px' }} />
  <span style={{ color: '#f0b429' }}>Trekkon</span>{' '}
  <span style={{ color: '#ffffff' }}>Tip Jar</span>
</h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '30px', lineHeight: '1.6' }}>
            What began as a hobby project turned into hundreds of hours of late-night coding and paying for various website hosting tools. Consider a one-time gift to help cover your league, support the platform, and keep the trek going!
        </p>

     {justTipped && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  }}>
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #f0b429',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '380px',
      textAlign: 'left',
    }}>
      <h3 style={{ color: '#f0b429', fontSize: '1.6rem', marginBottom: '12px' }}>
        <Image src="/logo-t.png" alt="" width={87} height={120} style={{ display: 'inline-block', height: '1.2em', width: 'auto', marginRight: '4px', verticalAlign: '-.1em' }} /> Thanks for your support!
      </h3>
      <p style={{ color: '#a0a0b0', fontSize: '1rem', marginBottom: '24px', lineHeight: '1.6' }}>
        Trekkon Fantasy Leagues could not continue without the patronage of league members like you! Now get out there and trek on!
      </p>
      <button
        onClick={() => window.history.replaceState(null, '', '/tip-jar')}
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
  padding: '20px 28px',
  marginBottom: '24px',
  maxWidth: '575px',
  boxSizing: 'border-box'
}}>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.6' }}>
Choose gift amount to support your favorite league-hosting platform:        </p>

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

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
            Show my name and gift amount on the Wall of Supporters?
          </label>
          {showName && (
            <input
              type="text"
              placeholder="Display Name (Leave Blank for Anonymous)"
              value={publicName}
              maxLength={24}
              onChange={(e) => setPublicName(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', marginBottom: '16px', borderRadius: '6px',
                border: '1px solid #2a2a3e', backgroundColor: '#12121a', color: '#ffffff',
                fontSize: '0.9rem', boxSizing: 'border-box'
              }}
            />
          )}

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
            {submitting ? 'Redirecting...' : 'Support Trekkon →'}
          </button>

          <p style={{ color: '#555570', fontSize: '0.85rem', marginTop: '16px' }}>
            Please note gifts are non-refundable and separate from any membership subscription.
          </p>
        </div>

              {supporters.length > 0 && (
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#1a1a2e',
            border: '1px solid #f0b429',
            borderRadius: '12px',
            padding: '24px 28px',
            maxWidth: '575px',
            boxSizing: 'border-box',
            animation: 'wallGlow 3.5s ease-in-out infinite'
          }}>
            {/* Floating sparkles */}
            {[...Array(14)].map((_, i) => (
              <span key={`spark-${i}`} style={{
                position: 'absolute',
                left: `${(i * 37) % 100}%`,
                bottom: '-6px',
                width: i % 3 === 0 ? '5px' : '3px',
                height: i % 3 === 0 ? '5px' : '3px',
                borderRadius: '50%',
                backgroundColor: i % 2 === 0 ? '#f0b429' : '#f5ff9c',
                boxShadow: '0 0 8px rgba(240, 180, 41, 0.9)',
                pointerEvents: 'none',
                opacity: 0,
                animation: `wallFloat ${3 + (i % 4) * 0.7}s ease-in-out ${(i % 7) * 0.5}s infinite`
              }} />
            ))}

            <p style={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              margin: '0 0 16px 0',
              background: 'linear-gradient(90deg, #f0b429 0%, #f5ff9c 50%, #f0b429 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              animation: 'wallShimmer 3s linear infinite'
            }}>
              ✦ Wall of Supporters ✦
            </p>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', rowGap: '16px', columnGap: '8px' }}>
              {supporters.map((s, i) => (
                <span key={i} style={{
                  backgroundColor: 'rgba(240, 180, 41, 0.12)',
                  border: '1px solid #f0b429',
                  color: '#f0b429',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.85rem',
                  opacity: 0,
                  boxShadow: i === 0 ? '0 0 12px rgba(240, 180, 41, 0.6)' : 'none',
                  animation: `wallPop 0.5s ease-out ${0.6 + i * 0.08}s forwards`
                }}>
                  {s.public_name} · ${(s.amount_cents / 100).toFixed(s.amount_cents % 100 === 0 ? 0 : 2)}
                </span>
              ))}
            </div>

            <style>{`
              @keyframes wallGlow {
                0%, 100% { box-shadow: 0 0 10px rgba(240, 180, 41, 0.25); }
                50% { box-shadow: 0 0 26px rgba(240, 180, 41, 0.55); }
              }
              @keyframes wallFloat {
                0% { transform: translateY(0); opacity: 0; }
                20% { opacity: 0.9; }
                80% { opacity: 0.7; }
                100% { transform: translateY(-180px); opacity: 0; }
              }
              @keyframes wallBurst {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                100% { transform: translate(var(--dx), var(--dy)) scale(0.4); opacity: 0; }
              }
              @keyframes wallShimmer {
                to { background-position: 200% center; }
              }
              @keyframes wallPop {
                0% { transform: scale(0.6); opacity: 0; }
                70% { transform: scale(1.08); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
          </div>
        )}

      </div>
    </main>
  )
}

export default function Extras() {
  return (
    <Suspense fallback={<div className="trekkon-bg" style={{ minHeight: '100vh' }} />}>
            <ExtrasContent />
    </Suspense>
  )
}