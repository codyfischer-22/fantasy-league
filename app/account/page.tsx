'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { upgradeTier } from '@/lib/upgradeTier'
import { Suspense } from 'react'

type Profile = {
  email: string
  tier: string
  display_name: string | null
  is_global_admin: boolean
}

function AccountContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const searchParams = useSearchParams()
  const highlightTier = searchParams.get('tier')

  const handleStripeCheckout = async (tier: string) => {
    if (!user) return
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, userId: user.id, email: user.email }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Something went wrong starting checkout. Please try again.')
    }
  }

  const handleUpgrade = async (tier: string) => {
    if (!user) return
    setUpgrading(tier)
    const { error } = await upgradeTier(user.id, tier)
    setUpgrading(null)
    if (!error) {
      setProfile((prev) => prev ? { ...prev, tier } : prev)
    } else {
      console.error('Upgrade error:', error)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      supabase
        .from('profiles')
        .select('email, tier, display_name, is_global_admin')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Profile fetch error:', error)
          }
          if (!error) {
            setProfile(data)
            setNameInput(data.display_name ?? '')
            setIsGlobalAdmin(data.is_global_admin ?? false)
          }
          setProfileLoading(false)
        })
    }
  }, [user, loading, router])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSaveMessage('')
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: nameInput })
      .eq('user_id', user.id)
    setSaving(false)
    if (error) {
      setSaveMessage('Something went wrong — try again.')
      console.error('Update error:', error)
    } else {
      setProfile((prev) => prev ? { ...prev, display_name: nameInput } : prev)
      setEditing(false)
      setSaveMessage('Saved!')
    }
  }

  if (loading || profileLoading) {
    return (
      <main style={{
        backgroundColor: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a0a0b0',
        fontFamily: 'Georgia, serif'
      }}>
        Loading...
      </main>
    )
  }

  if (!profile) {
    return (
      <main style={{
        backgroundColor: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a0a0b0',
        fontFamily: 'Georgia, serif'
      }}>
        Could not load your profile.
      </main>
    )
  }

  const tierLabels: Record<string, string> = {
    stowaway: 'Stowaway',
    castaway: 'Castaway',
    crewchief: 'Crew Chief',
    teamprincipal: 'Team Principal',
  }

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      padding: '60px 40px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '40px'
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none',
          border: 'none',
          color: '#a0a0b0',
          fontSize: '0.85rem',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '16px',
          fontFamily: 'inherit'
        }}>
          ← Back
        </button>
        <h1 style={{ color: '#f0b429', fontSize: '2rem', marginBottom: '24px' }}>
          My Account
        </h1>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}>Email</div>
          <div style={{ fontSize: '1.1rem' }}>{profile.email}</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}>Current Tier</div>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#12121a',
            color: '#f0b429',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '0.95rem'
          }}>
            {tierLabels[profile.tier] ?? profile.tier}
          </div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '8px' }}>Change Tier</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['stowaway', 'castaway', 'crewchief', 'teamprincipal'].map((t) => (
              <button
                key={t}
                onClick={() => (isGlobalAdmin || t === 'stowaway' ? handleUpgrade(t) : handleStripeCheckout(t))}
                disabled={upgrading !== null || profile.tier === t}
                style={{
                  backgroundColor: profile.tier === t ? '#f0b429' : 'transparent',
                  color: profile.tier === t ? '#0a0a0f' : '#f0b429',
                  border: '1px solid #f0b429',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: profile.tier === t ? 'default' : 'pointer',
                  opacity: upgrading !== null && upgrading !== t ? 0.5 : 1,
                  boxShadow: highlightTier === t ? '0 0 0 3px rgba(240, 180, 41, 0.5)' : 'none'
                }}
              >
                {upgrading === t ? '...' : (tierLabels[t] ?? t)}
              </button>
            ))}
          </div>
          <div style={{ color: '#555570', fontSize: '0.75rem', marginTop: '8px' }}>
          </div>
        </div>
        <div>
          <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}>Display Name</div>
          {editing ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #2a2a3e',
                  backgroundColor: '#12121a',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
              />
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: '#f0b429',
                  color: '#0a0a0f',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? '...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setNameInput(profile.display_name ?? '')
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: '#a0a0b0',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #2a2a3e',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '1.1rem' }}>{profile.display_name || 'Not set'}</div>
              <button
                onClick={() => setEditing(true)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#f0b429',
                  border: '1px solid #f0b429',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            </div>
          )}
          {saveMessage && (
            <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginTop: '8px' }}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function Account() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: '#0a0a0f', minHeight: '100vh' }} />}>
      <AccountContent />
    </Suspense>
  )
}