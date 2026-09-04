'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { containsEmoji } from '@/lib/validation'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [dob, setDob] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [heardAboutUs, setHeardAboutUs] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const router = useRouter()

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault()
  setMessage('')

  if (!agreedToTerms) {
    setMessage('You must agree to the Terms & Conditions to sign up.')
    return
  }

  const age = calculateAge(dob)
  if (age < 18) {
    setMessage('You must be at least 18 years old to create an account.')
    return
  }

  if (containsEmoji(displayName)) {
  setMessage('Display name cannot contain emojis.')
  return
}

  setLoading(true)

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .ilike('display_name', displayName)
    .maybeSingle()

  if (existing) {
    setMessage('Please choose an original display name.')
    setLoading(false)
    return
  }

const pendingInvite = localStorage.getItem('pendingInvitePath')

const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      date_of_birth: dob,
      agreed_to_terms: agreedToTerms,
      heard_about_us: heardAboutUs,
    },
    emailRedirectTo: pendingInvite
      ? `${window.location.origin}${pendingInvite}`
      : `${window.location.origin}/login`,
  },
})

  setLoading(false)

if (error) {
  setMessage(error.message)
} else {
  setSignedUp(true)
}}

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '16px',
    borderRadius: '6px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#12121a',
    color: '#ffffff'
  }

  const labelStyle = {
    display: 'block',
    color: '#a0a0b0',
    fontSize: '0.85rem',
    marginBottom: '6px'
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
      {signedUp ? (
        <div style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '12px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📬</div>
          <h1 style={{ color: '#f0b429', fontSize: '1.6rem', marginBottom: '12px' }}>
            Almost there!
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
            We&apos;ve sent a confirmation link to <strong style={{ color: '#ffffff' }}>{email}</strong>.
            Click the link in that email to activate your account; then come back and sign in.
          </p>
          <a href="/login" className="btn" style={{
            display: 'inline-block',
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '12px 28px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '0.95rem'
          }}>
            Go to Login →
          </a>
        </div>
      ) : (
        <form onSubmit={handleSignUp} style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '12px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px'
        }}>
          <h1 style={{ color: '#f0b429', fontSize: '1.8rem', marginBottom: '24px', textAlign: 'center' }}>
            Create Your Account
          </h1>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <label style={labelStyle}>Password</label>
       <input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
  minLength={6}
  style={inputStyle}
/>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>
          <p style={{ color: '#555570', fontSize: '0.75rem', marginTop: '-10px', marginBottom: '16px' }}>
            Don&apos;t worry; other players will only see display name.
          </p>
          <label style={labelStyle}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={32}
            required
            style={inputStyle}
          />
          <p style={{ color: '#555570', fontSize: '0.75rem', marginTop: '-10px', marginBottom: '16px' }}>
            This is what other players will see.
          </p>
          <label style={labelStyle}>Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            style={inputStyle}
          />
          <label style={labelStyle}>How&apos;d you hear about us? (optional)</label>
          <input
            type="text"
            value={heardAboutUs}
            onChange={(e) => setHeardAboutUs(e.target.value)}
            style={inputStyle}
          />
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '20px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: '3px' }}
            />
     <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
  I agree to the{' '}
  <a href="/terms" target="_blank" style={{ color: '#f0b429' }}>Terms & Conditions</a>
  {' '} and{' '}
  <a href="/privacy" target="_blank" style={{ color: '#f0b429' }}>Privacy Policy</a>.
</span>
          </label>
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          {message && (
            <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
              {message}
            </p>
          )}
          <p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#f0b429', fontWeight: 'bold', textDecoration: 'none' }}>
              Log in!
            </a>
          </p>
        </form>
      )}
    </main>
  )
}