'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    }
  }

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '40px 20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        textAlign: 'center'
      }}>
        {success ? (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✅</div>
            <h1 style={{ color: '#f0b429', fontSize: '1.5rem', marginBottom: '12px' }}>
              Password udated!
            </h1>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>
              Taking you to login...
            </p>
          </>
        ) : (
          <form onSubmit={handleReset}>
            <h1 style={{ color: '#f0b429', fontSize: '1.6rem', marginBottom: '24px' }}>
              Set a New Password
            </h1>

            <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px', textAlign: 'left' }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '16px',
                borderRadius: '6px',
                border: '1px solid #2a2a3e',
                backgroundColor: '#12121a',
                color: '#ffffff'
              }}
            />

            <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px', textAlign: 'left' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '20px',
                borderRadius: '6px',
                border: '1px solid #2a2a3e',
                backgroundColor: '#12121a',
                color: '#ffffff'
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#f0b429',
                color: '#0a0a0f',
                padding: '12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>

            {message && (
              <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '16px' }}>
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  )
}