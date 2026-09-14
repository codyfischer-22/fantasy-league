export function NotificationEmail({
  playerName,
  message,
  linkUrl,
  linkText,
}: {
  playerName: string
  message: string
  linkUrl?: string
  linkText?: string
}) {
  return (
    <div style={{
      backgroundColor: '#0a0a0f',
      color: '#ffffff',
      fontFamily: 'Georgia, serif',
      padding: '40px 30px',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <h1 style={{ color: '#f0b429', fontSize: '1.6rem', marginBottom: '20px' }}>
        ⚜️ Trekkon Fantasy Leagues
      </h1>
      <p style={{ color: '#ffffff', fontSize: '.95rem', marginBottom: '16px' }}>
        Hey {playerName},
      </p>
      <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
        {message}
      </p>
      {linkUrl && (
        <a
          href={linkUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '12px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '0.95rem',
          }}
        >
          {linkText ?? 'View on Trekkon →'}
        </a>
      )}
      <p style={{ color: '#555570', fontSize: '0.8rem', marginTop: '32px' }}>
        You&apos;re currently opted in to email updates at Trekkon Fantasy Leagues. You can opt out anytime in your "Account" tab.
      </p>
    </div>
  )
}