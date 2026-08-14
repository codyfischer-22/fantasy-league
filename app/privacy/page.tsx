'use client'

export default function PrivacyPage() {
  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '60px 40px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <a href="/" style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to Trekkon Fantasy Leagues
        </a>

        <h1 style={{ color: '#f0b429', fontSize: '2.25rem', marginBottom: '-2px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#555570', fontSize: '0.85rem', marginBottom: '24px' }}>
          Last updated: August 2026
        </p>

        <div style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.5' }}>

          <h2 style={{ color: '#f0b429', fontSize: '1.0rem', marginTop: '10px', marginBottom: '4px' }}>
            1. What We Collect
          </h2>
          <p>
            When you create an account, we collect your email address, first and last name,
            display name, and date of birth. Your first and last name are kept private and
            never shown to other players; only your display name is public. If you subscribe
            to a paid tier, payment information is processed securely by Stripe; we never see
            or store your full card number. Trekkon Fantasy Leagues has no access to username
            passwords.
          </p>

          <h2 style={{ color: '#f0b429', fontSize: '1.0rem', marginTop: '10px', marginBottom: '4px' }}>
            2. How We Use Your Information
          </h2>
          <p>
            We use your information to run your account, manage league memberships, process
            payments, send you notifications about your leagues (like draft results or scoring
            updates), and improve the platform. We do not sell your personal information to
            third parties.
          </p>

          <h2 style={{ color: '#f0b429', fontSize: '1.0rem', marginTop: '10px', marginBottom: '4px' }}>
            3. Where Your Data Lives
          </h2>
          <p>
            Your account data is stored securely with Supabase, our database and authentication
            provider. Payment information is handled entirely by Stripe under their own security
            standards; Trekkon Fantasy Leagues never stores your raw payment details.
          </p>

          <h2 style={{ color: '#f0b429', fontSize: '1.0rem', marginTop: '10px', marginBottom: '4px' }}>
            4. Cookies & Sessions
          </h2>
          <p>
            We use basic session cookies to keep you logged in between visits. We do not use
            third-party advertising or tracking cookies.
          </p>

          <h2 style={{ color: '#f0b429', fontSize: '1.0rem', marginTop: '10px', marginBottom: '4px' }}>
            5. Your Choices
          </h2>
          <p>
            You can update your display name at any time from your Account page. To request
            deletion of your account and associated data, contact us using the contact link.
          </p>

          <h2 style={{ color: '#f0b429', fontSize: '1.0rem', marginTop: '10px', marginBottom: '4px' }}>
            6. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Continued use of Trekkon
            Fantasy Leagues after changes are posted means you accept the updated policy.
          </p>

          <h2 style={{ color: '#f0b429', fontSize: '1.0rem', marginTop: '10px', marginBottom: '4px' }}>
            7. Questions
          </h2>
          <p>
            Reach out via our contact link with any further questions about this policy.
          </p>

        </div>
      </div>
    </main>
  )
}