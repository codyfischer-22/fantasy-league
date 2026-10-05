'use client'

type Props = {
  onClose: () => void
}

const MIN_WIDTH = 1024

export default function MobileBlockModal({ onClose }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #f0b429',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        <h3 style={{ color: '#f0b429', fontSize: '1.1rem', marginBottom: '14px' }}>
          Screen Too Small
        </h3>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
          We&apos;re sorry, but this game is not yet configured for mobile devices. If you would like to participate, please join on a desktop computer or another screen with at least {MIN_WIDTH}px wide dimensions.
        </p>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '10px 28px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}