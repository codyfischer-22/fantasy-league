'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Lock, ListOrdered, RefreshCw, ClipboardList } from 'lucide-react'

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
      '➤ Public leagues default to an offline snake draft with a randomly-assigned draft order, but Trekkon Fantasy Leagues may opt to draft live or manually assign pick order.',
      '➤ For offline drafts, players pre-rank castaways in the order they\u2019d pick them if available. Failure to rank castaways will result in a randomly-generated tribe (sans petition).',
      '➤ In the event of a live draft, players may utilize the ranking and auto-draft feature to pre-select castaways in their absence.',
      '➤ Castaways will be cloned until each player can draft a 4-person tribe.',
      '(If there are 50 players, for example, we\u2019d need 200 draftable castaways. All 21 contestants would be cloned 10 times to make a 210-person draft pool.)',
      '➤ Draft results are final once shared; if you don\u2019t get your top choices, it\u2019s because popular castaways ran out before your turn.',
      '➤ Don\u2019t like your 4-person tribe? Visit the Trade Portal to offer trades or swap out of the Waiver Wire.',
    ],
  draftFormatPrivate: [
      '➤ Private leagues default to live snake drafts, but hosts may opt for offline, automatic drafts (see details above).',
      '➤ League hosts choose between manual or randomly-assigned draft order.',
      '➤ Hosts are responsible for coordinating and manually starting their draft.',
      '➤ Hosts opt in for selection time limits (recommended) between 45 seconds and 15 minutes. If timers expire, they decide if a player\u2019s turn is bumped to the back of the draft or if a castaway is randomly assigned.',
      '➤ After 4 bumped turns, further missed picks will be randomly assigned. It would be better, however, for absent players to utilize ranking and auto-draft feature.',
      '➤ If a private draft stalls out on one player with no selection timer (not recommended), it is the host\u2019s responsibility to communicate with Trekkon Fantasy Leagues. At host discretion, players may be randomly assigned a tribe or ejected after draft.',
      '➤ Trekkon Fantasy Leagues is not responsible for private league hosts failing to communicate or coordinate live draft. Before joining a league, players should trust hosts to lead responsibly.',
    ],
    trades: [
      '➤ Every player, regardless of membership tier, can propose and accept trades.',
      '➤ After rosters are drafted, uneliminated castaways can be traded up until the finale.',
      '➤ To allow time to input scores, the trade window closes for 24 hours following each episode airtime.',
      '➤ League hosts may elect to confirm player-to-player trades before they\u2019re official.',
      '➤ Individual castaways cannot be included in more than one trade offer at a time.',
      '➤ Trade offers do not expire; they sit until accepted, declined, or withdrawn by sender.',
      '➤ Players must act in their own self-interest to finish well in season-end standings. Out-of-contention players should not "give away" players to help others win.',
      '➤ If players are caught manipulating trades with multiple accounts or friends, they will be banned from current and future league participation.',
    ],
    lateJoinsWaiverWire: [
'➤ No one may join, leave, or be ejected from a league while live draft is running.',
  '➤ Once drafts are complete, leftover clones become available in the Waiver Wire (until eliminated and in standard trade window).',
  '➤ Newcomers can join a post-draft league and claim free agents if 3+ remain.',
  '➤ If a player leaves a league, there is no guarantee they will recoup their starting 4 castaways.'
]
  },
  'uncharted-turretory': {
    leagueName: 'Uncharted Turretory',
  intro: [],
   draftFormatPublic: [
      '➤ Public leagues default to an offline snake draft with a randomly-assigned draft order, but Trekkon Fantasy Leagues may opt to draft live or manually assign pick order.',
      '➤ For offline drafts, players pre-rank castle-goers in the order they\u2019d pick them if available. Failure to rank castle-goers will result in a randomly-generated roster (sans petition).',
      '➤ In the event of a live draft, players may utilize the ranking and auto-draft feature to pre-select castle-goers in their absence.',
      '➤ Castle-goers will be cloned until each player can draft a 4-person roster.',
      '(If there are 50 players, for example, we\u2019d need 200 draftable castle-goers. All 22 contestants would be cloned 10 times to make a 220-person draft pool.)',
      '➤ Draft results are final once shared; if you don\u2019t get your top choices, it\u2019s because popular castle-goers ran out before your turn.',
      '➤ Don\u2019t like your 4-person roster? Visit the Trade Portal to offer trades or swap out of the Waiver Wire.',
    ],
    draftFormatPrivate: [
      '➤ Private leagues default to live snake drafts, but hosts may opt for offline, automatic drafts (see details above).',
      '➤ League hosts choose between manual or randomly-assigned draft order.',
      '➤ Hosts are responsible for coordinating and manually starting their draft.',
      '➤ Hosts opt in for selection time limits (recommended) between 45 seconds and 15 minutes. If timers expire, they decide if a player\u2019s turn is bumped to the back of the draft or if a castle-goer is randomly assigned.',
      '➤ After 4 bumped turns, further missed picks will be randomly assigned. It would be better, however, for absent players to utilize ranking and auto-draft feature.',
      '➤ If a private draft stalls out on one player with no selection timer (not recommended), it is the host\u2019s responsibility to communicate with Trekkon Fantasy Leagues. At host discretion, players may be randomly assigned a roster or ejected after draft.',
      '➤ Trekkon Fantasy Leagues is not responsible for private league hosts failing to communicate or coordinate live draft. Before joining a league, players should trust hosts to lead responsibly.',
    ],
       trades: [
      '➤ Every player, regardless of membership tier, can propose and accept trades.',
      '➤ After rosters are drafted, uneliminated castle-goers can be traded up until the finale.',
      '➤ To allow time to input scores, the trade window closes for 24 hours following each episode airtime.',
      '➤ League hosts may elect to confirm player-to-player trades before they\u2019re official.',
      '➤ Individual castle-goers cannot be included in more than one trade offer at a time.',
      '➤ Trade offers do not expire; they sit until accepted, declined, or withdrawn by sender.',
      '➤ Players must act in their own self-interest to finish well in season-end standings. Out-of-contention players should not "give away" players to help others win.',
      '➤ If players are caught manipulating trades with multiple accounts or friends, they will be banned from current and future league participation.',
       ],
    lateJoinsWaiverWire: [
  '➤ No one may join, leave, or be ejected from a league while live draft is running.',
  '➤ Once drafts are complete, leftover clones become available in the Waiver Wire (until eliminated and in standard trade window).',
  '➤ Newcomers can join a post-draft league and claim free agents if 3+ remain.',
  '➤ If a player leaves a league, there is no guarantee they will recoup their starting 4 castle-goers.'
],
  },
}

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
  const rulesHref = type && draftContent[type] ? `/leagues/${type}/rules` : '/leagues/secrets-on-the-beach/rules'

  const generalIntro = (
    <>Here&rsquo;s everything you need to know about public drafts, private drafts, trades, waiver wires, and late joins. Official deadlines for this season can be found in{' '}
    <a href={rulesHref} style={{ color: '#f0b429', textDecoration: 'underline' }}>Rules & Scoring</a>.</>
  )
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

        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back()
            } else {
              router.push(`/leagues/${type}`)
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: '#a0a0b0',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'inline-block',
            marginBottom: '24px'
          }}
        >
          ← Back to Previous Page
        </button>

            <h1 style={{
          fontSize: 'clamp(1.6rem, 8vw, 2.25rem)',
          margin: 0,
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          rowGap: '0px',
          columnGap: '10px'
        }}>
          <ListOrdered size={32} strokeWidth={2} color="#f0b429" style={{ flexShrink: 0 }} />
          <span style={{ color: '#f0b429' }}>Trekkon Leagues</span>
          <span className="mobile-full-width-break" style={{ color: '#ffffff' }}>Draft, Trades & Waivers</span>
        </h1>

        <p style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.7', margin: '0 0 16px 0' }}>
          {generalIntro}
        </p>

        {!content && (
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.95rem', marginBottom: '8px' }}>
              View &quot;Draft, Trades &amp; Waivers&quot; for the following league:
            </label>
            <select
              value={type === 'all' ? '' : type ?? ''}
              onChange={(e) => handleDraftTypeChange(e.target.value)}
              style={{
                display: 'block',
                marginLeft: 0,
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
    Check out &quot;Draft, Trades &amp; Waivers&quot; for another league:  </label>
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