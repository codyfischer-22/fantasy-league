'use client'

import { RuleCard } from '@/lib/social-game/ruleCards'

type Props = {
  card: RuleCard
  isActive: boolean
}

export default function RuleCorner({ card, isActive }: Props) {
  return (
    <div style={{
  backgroundColor: isActive ? 'rgba(26, 26, 46, 0.97)' : 'rgba(26, 26, 46, 0.85)',
  border: isActive ? '2px solid #f0b429' : '1px solid #2a2a3e',
  borderRadius: '10px',
  padding: '14px',
      transition: 'opacity 0.3s, border-color 0.3s',
      textAlign: 'left',
      boxSizing: 'border-box',
      height: '100%'
    }}>
     <h4 style={{ color: isActive ? '#f0b429' : '#a0a0b0', fontSize: '0.9rem', marginBottom: '6px', textDecoration: 'underline' }}>
  {card.heading}
</h4>
      {card.body.split('\n\n').map((paragraph, i) => (
        <p
          key={i}
          style={{
            color: '#a0a0b0',
            fontSize: '0.78rem',
            lineHeight: '1.4',
            marginBottom: i === card.body.split('\n\n').length - 1 ? 0 : '8px'
          }}
        >
          {paragraph}
        </p>
      ))}
    </div>
  )
}