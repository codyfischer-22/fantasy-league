'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Mail } from 'lucide-react'

export default function ContactPage() {
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setStatus('idle')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, reason, message }),
    })

    const data = await res.json()
    setSending(false)

    if (data.success) {
      setStatus('success')
      setStatusMessage('Thanks for reaching out! We\u2019ll get back to you soon.')
      setName('')
      setReason('')
      setMessage('')
    } else {
      setStatus('error')
      setStatusMessage(data.error || 'Something went wrong. Please try again.')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '16px',
    borderRadius: '6px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#12121a',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontFamily: 'inherit'
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
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '60px 20px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '12px',
          padding: '36px',
          width: '100%'
        }}>
          <h1 style={{ color: '#f0b429', fontSize: '1.8rem', marginBottom: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
  <Mail size={30} strokeWidth={2} style={{ position: 'relative', top: '1px' }} /> Contact Trekkon
</h1>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '28px', textAlign: 'center' }}>
            We&apos;d love to hear from you with any questions, league suggestions, bugs discovered, or real-world inspirations!
          </p>

          <label style={labelStyle}>Player Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Email Address:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Select Reason for Contact:</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={{
              ...inputStyle,
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f0b429' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px',
              paddingRight: '36px'
            }}
          >
            <option value="Other">Miscellaneous Question</option>
            <option value="Signup Question">Signup Question</option>
            <option value="Billing Question">Billing Question</option>
            <option value="League Question (Already Member)">League Question (I&apos;m a Member)</option>
            <option value="Suggest a New League">Suggest a New League</option>
          </select>

          <label style={labelStyle}>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <button
            type="submit"
            disabled={sending}
            className="btn-gold"
            style={{
              width: '100%',
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '12px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: sending ? 'not-allowed' : 'pointer'
            }}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>

          {status !== 'idle' && (
            <p style={{
              color: status === 'success' ? '#f0b429' : '#ff6b6b',
              fontSize: '0.9rem',
              marginTop: '16px',
              textAlign: 'center'
            }}>
              {statusMessage}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}