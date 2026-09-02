'use client'

type ConfirmModalProps = {
  open: boolean
  title: string
  message: string | string[]
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1a1a2e',
          border: `1px solid ${danger ? '#ff6b6b' : '#f0b429'}`,
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'left'
        }}
      >
         <h3 style={{ color: danger ? '#ff6b6b' : '#f0b429', fontSize: '1.3rem', marginBottom: '12px', textAlign: 'left' }}>
    {title}
  </h3>
  {(Array.isArray(message) ? message : [message]).map((line, i) => (
    <p key={i} style={{ color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '16px', lineHeight: '1.6', textAlign: 'left' }}>
      {line}
    </p>
  ))}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'left' }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: 'transparent',
              color: '#a0a0b0',
              border: '1px solid #2a2a3e',
              padding: '10px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: danger ? '#ff6b6b' : '#f0b429',
              color: danger ? '#ffffff' : '#0a0a0f',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}