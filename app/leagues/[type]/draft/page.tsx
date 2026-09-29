'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Lock, ListOrdered, RefreshCw, Calendar, ClipboardList } from 'lucide-react'

type InfoRow = {
  label: string
  detail: string
}

const draftContent: Record<string, {
  leagueName: string
  intro: (string | ReactNode)[]
  draftFormatPublic: string[]
  draftFormatPrivate: string[]
  trades: string[]
  lateJoinsWaiverWire: string[]
}> = {
  'secrets-on-the-beach': {
    leagueName: 'Secrets on the Beach',
 intro: [],
    draftFormatPublic: [
      '➤ Public leagues use an offline snake draft, with a randomly-assigned draft order, where players pre-rank castaways in the order they\u2019d pick them if available.',
      '➤ Castaways will be cloned until each player can draft a 4-person tribe.',
      '(If there are 50 players, for example, we\u2019d need 200 draftable castaways. All 21 contestants would be cloned 10 times to make a 210-person draft pool.)',
      '➤ Players failing to submit castaway rankings before the draft will have them randomly ranked without petition.',
      '➤ Simulated draft results are final once shared; if players don\u2019t get their top choices, it\u2019s because those castaways were popular and ran out before their turn.',
      '➤ Don\u2019t like your 4-person tribe? Visit the Trade Portal to offer trades or poach from the Waiver Wire.',
    ],
  draftFormatPrivate: [
      '➤ Private league hosts may randomly generate or manually assign draft order.',
      '➤ Hosts are responsible for coordinating and manually starting the live snake draft.',
      '➤ Hosts opt in or out for selection time limits (recommended) between 2 minutes and 3 hours.',
      '➤ Players receive time warning notifications at 10, 5, and 1 minutes remaining for a given pick.',
      '➤ Hosts decide if expired timers result in A) picks being skipped and moved to the end of the draft or B) a castaway being randomly selected.',
      '➤ In the case of no selection timer (not recommended) and players failing to draft, is the host\u2019s responsibility to communicate with Trekkon Fantasy Leagues. Players ignoring draft procedures outlined by the league host are unable to petition their roster.',
      '➤ Trekkon Fantasy Leagues is not responsible for private league hosts failing to communicate or coordinate live draft. Before joining a league, players should trust hosts to lead responsibly.',
    ],
    trades: [
      '➤ Every player, regardless of membership tier, can propose and accept trades.',
      '➤ After rosters are drafted, uneliminated castaways can be traded up until the finale.',
      '➤ The trade window closes for 24 hours following each episode airtime.',
      '➤ League hosts may elect to confirm player-to-player trades before they\u2019re official.',
      '➤ Individual castaways cannot be included in more than one trade offer at a time.',
      '➤ Trade offers do not expire; they sit until accepted, declined, or withdrawn by sender.',
      '➤ Players must act in their own self-interest to finish well in season-end standings. Out-of-contention players should not "give away" players to help others win.',
      '➤ If players are caught manipulating trades with multiple accounts or friends, they will be banned from current and future league participation.',
    ],
    lateJoinsWaiverWire: [
  '➤ Once drafts are complete, leftover clones become free agents until eliminated.',
  '➤ Newcomers can join a post-draft league and claim free agents if 3+ remain.',
  '➤ In the standard trade window, league members may swap rostered castle-goers with free agents in the Waiver Wire.',
],
  },
  'uncharted-turretory': {
    leagueName: 'Uncharted Turretory',
  intro: [],
   draftFormatPublic: [
      '➤ Public leagues use an offline snake draft, with a randomly-assigned draft order, where players pre-rank castle-goers in the order they\u2019d pick them if available.',
      '➤ Castle-goers will be cloned until each player can draft a 4-person roster.',
      '(If there are 50 players, for example, we\u2019d need 200 draftable castle-goers. All 21 contestants would be cloned 10 times to make a 210-person draft pool.)',
      '➤ Players failing to submit castle-goer rankings before the draft will have them randomly ranked without petition.',
      '➤ Simulated draft results are final once shared; if players don\u2019t get their top choices, it\u2019s because those castle-goers were popular and ran out before their turn.',
      '➤ Don\u2019t like your 4-person roster? Visit the Trade Portal to offer trades or poach from the Waiver Wire.',
    ],
    draftFormatPrivate: [
      '➤ Private league hosts may randomly generate or manually assign draft order.',
      '➤ Hosts are responsible for coordinating and manually starting the live snake draft.',
      '➤ Hosts opt in or out for selection time limits (recommended) between 2 minutes and 3 hours.',
      '➤ Players receive time warning notifications at 10, 5, and 1 minutes remaining for a given pick.',
      '➤ Hosts decide if expired timers result in A) picks being skipped and moved to the end of the draft or B) a castle-goer being randomly selected.',
      '➤ In the case of no selection timer (not recommended) and players failing to draft, is the host\u2019s responsibility to communicate with Trekkon Fantasy Leagues. Players ignoring draft procedures outlined by the league host are unable to petition their roster.',
      '➤ Trekkon Fantasy Leagues is not responsible for private league hosts failing to communicate or coordinate live draft. Before joining a league, players should trust hosts to lead responsibly.',
    ],
       trades: [
      '➤ Every player, regardless of membership tier, can propose and accept trades.',
      '➤ After rosters are drafted, uneliminated castle-goers can be traded up until the finale.',
      '➤ The trade window closes for 24 hours following each episode airtime.',
      '➤ League hosts may elect to confirm player-to-player trades before they\u2019re official.',
      '➤ Individual castle-goers cannot be included in more than one trade offer at a time.',
      '➤ Trade offers do not expire; they sit until accepted, declined, or withdrawn by sender.',
      '➤ Players must act in their own self-interest to finish well in season-end standings. Out-of-contention players should not "give away" players to help others win.',
      '➤ If players are caught manipulating trades with multiple accounts or friends, they will be banned from current and future league participation.',
       ],
    lateJoinsWaiverWire: [
  '➤ Once drafts are complete, leftover clones become free agents until eliminated.',
  '➤ Newcomers can join a post-draft league and claim free agents if 3+ remain.',
  '➤ In the standard trade window, league members may swap rostered castle-goers with free agents in the Waiver Wire.',
],
  },
}

const generalIntro = (
  <>Here&rsquo;s everything you need to know about public drafts, private drafts, trades, waiver wires, and late joins. Official deadlines for this season can be found in{' '}
  <a href="/leagues/secrets-on-the-beach/rules" style={{ color: '#f0b429', textDecoration: 'underline' }}>Rules & Scoring</a>.</>
)

const draftTypeOptions = [
  { value: 'secrets-on-the-beach', label: '🏝️ Secrets on the Beach', comingSoon: false },
  { value: 'uncharted-turretory', label: '🗡️ Uncharted Turretory', comingSoon: false },
  { value: 'paddock-politicks', label: '🏎️ Paddock Politicks', comingSoon: true },
  { value: 'the-oval-offset', label: '🚗 The Oval Offset', comingSoon: true },
]

export default function DraftPage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string | undefined
  const content = type ? draftContent[type] : null
  const [showComingSoon, setShowComingSoon] = useState(false)

  const handleDraftTypeChange = (selectedType: string) => {
    const option = draftTypeOptions.find((opt) => opt.value === selectedType)
    if (option?.comingSoon) {
      setShowComingSoon(true)
      return
    }
    router.push(`/leagues/${selectedType}/draft`)
  }

  return (
        <main style={{
      backgroundColor: '#0a0a0f',
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

        <h1 style={{
  fontSize: 'clamp(1.6rem, 8vw, 2.25rem)',
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px 10px'
}}>
  <ListOrdered size={32} strokeWidth={2} color="#f0b429" style={{ flexShrink: 0 }} />
          <span style={{ color: '#f0b429' }}>Trekkon</span>{' '}
          <span style={{ color: '#ffffff' }}>Draft, Trades & Waivers</span>
        </h1>

        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.45', marginBottom: '24px' }}>
  {generalIntro}
</p>

        {!content && (
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '8px' }}>
              View "Draft & Trading" for the following league:
            </label>
            <select
              value={type === 'all' ? '' : type ?? ''}
              onChange={(e) => handleDraftTypeChange(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #2a2a3e',
                backgroundColor: '#12121a',
                color: '#ffffff',
                fontSize: '1rem',
                width: '100%',
                maxWidth: '320px'
              }}
            >
              <option value="" disabled>Select League...</option>
              {draftTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}{opt.comingSoon ? ' (Coming Soon)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {!content ? null : (
          <>
            <div style={{ marginBottom: '28px' }}>
              {content.intro.map((para, i) => (
                <p key={i} style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.45', marginBottom: '12px' }}>
                  {para}
                </p>
              ))}
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListOrdered size={22} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '0px' }} />
                Public Draft Procedures
              </h2>
              <div style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '10px',
                padding: '20px'
              }}>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  {content.draftFormatPublic.map((line, i) => (
                    <li
                      key={i}
                      style={{
                        marginBottom: '12px',
                        ...(line.startsWith('"') || line.startsWith('(') ? { fontStyle: 'italic', marginLeft: '20px' } : {})
                      }}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={22} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '-2px' }} />
                Private Draft Procedures
              </h2>
              <div style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '10px',
                padding: '20px'
              }}>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.45' }}>
                  {content.draftFormatPrivate.map((line, i) => (
                    <li key={i} style={{ marginBottom: '12px' }}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={22} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '-.5px' }} />
                Trade Procedures
              </h2>
              <div style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '32px'
              }}>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.45' }}>
                  {content.trades.map((line, i) => (
                    <li key={i} style={{ marginBottom: '12px' }}>{line}</li>
                  ))}
                </ul>
              </div>

<div style={{ marginBottom: '32px' }}>
  <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
    <ClipboardList size={22} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '-1px' }} />
    Late Joins & Waiver Wire
  </h2>
  <div style={{
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '10px',
    padding: '20px'
  }}>
    <ul style={{ margin: 0, paddingLeft: '20px', color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.45' }}>
      {content.lateJoinsWaiverWire.map((line, i) => (
        <li key={i} style={{ marginBottom: '12px' }}>{line}</li>
      ))}
    </ul>
  </div>
</div>

<div style={{ marginBottom: '32px' }}>
  <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
    Check out "Draft & Trading" for another league:
  </label>
  <select
    value={type ?? ''}
    onChange={(e) => handleDraftTypeChange(e.target.value)}
    style={{
      padding: '10px 14px',
      borderRadius: '6px',
      border: '1px solid #2a2a3e',
      backgroundColor: '#12121a',
      color: '#ffffff',
      fontSize: '1rem',
      width: '100%',
      maxWidth: '320px'
    }}
  >
    <option value="" disabled>Select League...</option>
    {draftTypeOptions.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}{opt.comingSoon ? ' (Coming Soon)' : ''}
      </option>
    ))}
  </select>
</div>
</div>
          </>
        )}

      </div>

      {showComingSoon && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #f0b429',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '380px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              We&apos;re sorry! The track is still being paved. Try back soon for our new racing leagues!
            </p>

            <button onClick={() => setShowComingSoon(false)} style={{
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '10px 28px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              Got it!
            </button>
          </div>
        </div>
      )}

    </main>
  )
}