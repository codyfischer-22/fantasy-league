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
  const messageParts = message.split('\n\n')

  return (
    <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ backgroundColor: '#0a0a0f' }}>
      <tbody>
        <tr>
          <td align="center" style={{ padding: '40px 20px' }}>
            <table width="600" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '20px 10px' }}>
                    <h1 style={{ color: '#f0b429', fontSize: '1.6rem', fontFamily: 'Georgia, serif', marginBottom: '20px' }}>
                      ⚜️ Trekkon Fantasy Leagues
                    </h1>
                    <p style={{ color: '#ffffff', fontSize: '1rem', fontFamily: 'Georgia, serif', marginBottom: '16px' }}>
                      Hey {playerName},
                    </p>
                    {messageParts.map((part, i) => (
                      <p key={i} style={{ color: '#a0a0b0', fontSize: '0.95rem', fontFamily: 'Georgia, serif', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-line' }}>
                        {part}
                      </p>
                    ))}
                    {linkUrl && (
                      <table cellPadding={0} cellSpacing={0} border={0}>
                        <tbody>
                          <tr>
                            <td style={{ backgroundColor: '#f0b429', borderRadius: '8px' }}>
                              <a
                                href={linkUrl}
                                style={{
                                  display: 'inline-block',
                                  color: '#0a0a0f',
                                  padding: '12px 28px',
                                  textDecoration: 'none',
                                  fontWeight: 'bold',
                                  fontFamily: 'Georgia, serif',
                                  fontSize: '0.95rem',
                                }}
                              >
                                {linkText ?? 'View on Trekkon →'}
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                    <p style={{ color: '#555570', fontSize: '0.8rem', fontFamily: 'Georgia, serif', marginTop: '32px' }}>
                      You&apos;re currently opted in to email updates at Trekkon Fantasy Leagues. You can opt out anytime in your &quot;Account&quot; tab.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  )
}