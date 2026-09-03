'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [showForgotPassword, setShowForgotPassword] = useState(false)
const [resetEmail, setResetEmail] = useState('')
const [resetMessage, setResetMessage] = useState('')
const [resetLoading, setResetLoading] = useState(false)



  const handleResetPassword = async () => {
  if (!resetEmail) {
    setResetMessage('Please enter your email address.')
    return
  }

  setResetLoading(true)
  setResetMessage('')

  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  setResetLoading(false)

  if (error) {
    setResetMessage(error.message)
  } else {
    setResetMessage('Check your email for a password reset link!')
  }
}

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setMessage('')

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  setLoading(false)

  if (error) {
    if (error.message === 'Invalid login credentials') {
      setMessage('Invalid email or password. Please try again.')
    } else {
    setMessage(error.message)
  }
} else {
  const pendingInvite = localStorage.getItem('pendingInvitePath')
  if (pendingInvite) {
    router.push(pendingInvite)
  } else {
    router.push('/')
  }
}}

return (
    <main className="auth-page" style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
      color: '#ffffff'
    }}>
      <form onSubmit={handleLogin} style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px'
      }}>
        <h1 style={{ color: '#f0b429', fontSize: '1.8rem', marginBottom: '24px', textAlign: 'center' }}>
          Welcome Back
        </h1>

        <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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

        <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '0px' }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '4px',
            borderRadius: '6px',
             border: '1px solid #2a2a3e',
    backgroundColor: '#12121a',
            color: '#ffffff'
          }}
        />

<button
  type="button"
  onClick={() => setShowForgotPassword(!showForgotPassword)}
  style={{
    background: 'none',
    border: 'none',
    color: '#555570',
    fontSize: '0.8rem',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '20px',
    fontFamily: 'inherit'
  }}
>
  Forgot your password?
</button>

{showForgotPassword && (
  <div style={{
    marginBottom: '20px',
    textAlign: 'left',
  }}>
    <input
      type="email"
      placeholder="Enter Email for Reset Password"
      value={resetEmail}
      onChange={(e) => setResetEmail(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 10px',
        marginBottom: '10px',
        borderRadius: '6px',
        border: '1px solid #2a2a3e',
        backgroundColor: '#1a1a2e',
        color: '#ffffff',
        fontSize: '0.8rem'
      }}
    />
    <button
      type="button"
      onClick={handleResetPassword}
      disabled={resetLoading}
      style={{
        backgroundColor: '#f0b429',
        color: '#0a0a0f',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        cursor: resetLoading ? 'not-allowed' : 'pointer'
      }}
    >
      {resetLoading ? 'Sending...' : 'Send Link'}
    </button>
    {resetMessage && (
      <p style={{ color: '#a0a0b0', fontSize: '0.8rem', marginTop: '10px' }}>
        {resetMessage}
      </p>
    )}
  </div>
)}

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
          {loading ? 'Logging In...' : 'Log In'}
        </button>

        {message && (
          <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
            {message}
          </p>
        )}

<p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
  Don&apos;t have an account?{' '}
  <a href="/signup" style={{ color: '#f0b429', fontWeight: 'bold', textDecoration: 'none' }}>
    Sign up!
  </a>
</p>

      </form>
    </main>
  )
}