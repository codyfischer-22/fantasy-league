export function NotificationEmail({
  playerName,
  message,
  linkUrl,
  linkText,
  imageUrl,
}: {
  playerName: string
  message: string
  linkUrl?: string
  linkText?: string
  imageUrl?: string
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
                                      <img
                      src="https://trekkonleagues.com/logo-email.png"
                      alt="Trekkon Fantasy Leagues"
                      width="300"
                      style={{ display: 'block', width: '300px', maxWidth: '100%', height: 'auto', border: 0, marginBottom: '24px' }}
                    />
                    <p style={{ color: '#ffffff', fontSize: '1rem', fontFamily: 'Georgia, serif', marginBottom: '16px' }}>
                      Hey {playerName},
                    </p>
                    {messageParts.map((part, i) => (
                      <p key={i} style={{ color: '#a0a0b0', fontSize: '0.95rem', fontFamily: 'Georgia, serif', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-line' }}>
                        {part}
                      </p>
                    ))}
                    {imageUrl && (
                      <table cellPadding={0} cellSpacing={0} border={0} style={{ marginBottom: '20px' }}>
                        <tbody>
                          <tr>
                            <td>
                              <img
                                src={imageUrl}
                                alt=""
                                width="100%"
                                style={{ maxWidth: '100%', borderRadius: '8px', display: 'block' }}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
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
                      You&apos;re currently opted in to email updates at Trekkon Fantasy Leagues. You can opt out anytime in your{' '}
                      <a href="https://trekkonleagues.com/account" style={{ color: '#a0a0b0', textDecoration: 'underline' }}>
                        &quot;Account&quot;</a> tab.
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