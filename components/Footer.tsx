export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#12121a',
      borderTop: '2px solid #f0b429',
      padding: '30px 40px',
      textAlign: 'center',
      color: '#a0a0b0',
      fontSize: '1.0rem'
    }}>
      <p style={{ marginBottom: '8px' }}>
        ⚜️ <span style={{ color: '#f0b429', fontWeight: 'bold' }}>Trekkon Fantasy Leagues</span> — All Rights Reserved
      </p>
      <p style={{ fontSize: '.9em', color: '#555570', marginBottom: '0px' }}>
        Trekkon Fantasy Leagues is an independent, fan-run platform not affiliated with,
        endorsed by, or connected to any official sports organization or television network.
      </p>
      <p style={{
        color: '#555570',
        fontSize: '.9em',
        lineHeight: '1.7',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        There is no mandatory entry fee or requirements to participate/win in this league.
      </p>
      <p style={{
        color: '#4c4c55',
        fontSize: '.75em',
        marginTop: '8px'
      }}>
        <a href="/terms" style={{ color: '#4c4c55', textDecoration: 'underline' }}>Terms & Conditions</a>
        {'  •  '}
        <a href="/privacy" style={{ color: '#4c4c55', textDecoration: 'underline' }}>Privacy Policy</a>
      </p>
    </footer>
  )
}