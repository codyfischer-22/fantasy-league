'use client'

import { useParams } from 'next/navigation'

type InfoRow = {
  label: string
  detail: string
}

const draftContent: Record<string, {
  leagueName: string
  intro: string[]
  draftWindow: InfoRow[]
  draftFormatPublic: string[]
  draftFormatPrivate: string[]
  trades: string[]
}> = {
  'politics-on-the-beach': {
    leagueName: 'Politics on the Beach',
    intro: [
      'Here\u2019s everything you need before the draft window \u2014 timing, format, and how trades work once your roster is set.',
    ],
    draftWindow: [
      { label: 'Signup Deadline', detail: 'Sunday, Sept. 13, 11:59 PM CT' },
      { label: 'Draft Rankings Due (Public)', detail: 'Tuesday, Sept. 15, 5 PM CT' },
      { label: 'Draft Order Set', detail: 'Tuesday, Sept. 15, 7 PM CT \u2013 Wednesday, Sept. 16, 5 PM CT' },
      { label: 'Draft Window', detail: 'Wednesday, Sept. 16, 7 PM CT \u2013 Sunday, Sept. 20, 7 PM CT' },
      { label: 'Episode 1 Airs', detail: 'Wednesday, Sept. 23, 7 PM CT' },
    ],
    draftFormatPublic: [
        '➤ Given the hundreds of participants we expect in public leagues, we will implement an offline draft (via app form) where each player ranks the order in which they would draft castaways if available:',
        '"I would take 1) Attractive Alex, 2) Smarty Pants Perry, 3) Beef Cake Casey . . . 21) Snivelling Sam."',
'➤ Every castaway will be "cloned" as necessary so each player can have a tribe of 4.',
'(If there are 100 players in the league, we would need 400 unique castaways to draft. With 21 real-life castaways, they would each be cloned 20 times to make 420 draftable league castaways.)',
        '➤ The order in which players draft is randomly assigned.',
        '➤ Players failing to submit castaway rankings by the deadline above will have them automatically submitted in alphabetical order (by last name) without petition.',
        '➤ In the draft window noted above, Trekkon Fantasy Leagues will use rankings to simulate a snake draft.',
        '(In Round 1, Player 1 will draft before Players 2, 3, 4 . . . 100. After the last player drafts, Round 2 will begin in reverse order \u2014 Players 100, 99, 98 . . . 3, 2, 1. This "snaking" continues until all 4 draft rounds are complete and ensures each player gets high- and low-level choices.)',
        '➤ Simulated draft results are final once shared; if players don\u2019t get their top choices, it\u2019s because those castaways were popular and ran out before their turn.',
        '➤ Don\u2019t like your 4-person tribe?! Time to get trading!',
            
    ],
    draftFormatPrivate: [
      '➤ Live draft order is randomly generated, but league hosts may manually adjust at their discretion.',
'➤ Private league hosts are responsible for manually starting the live snake draft.',
      '➤ Private league hosts are responsible for selecting and communicating live draft time limits (from 2 minutes to 3 hours per pick).',
      '➤ Players get time warnings at 10, 5, and 1 minutes remaining in their live draft pick.',
      '➤ If a draft pick timer runs out, the host decides if that player\u2019s pick is A) skipped and moved to the end of the live draft or B) assigned a randomly-generated player on the draft board.',
      '➤ If the live draft is not completed by the window above, league hosts or Trekkon Fantasy Leagues ensure all players have 4 castaways on their tribe. Players failing to adhere to draft procedures outlined by the league host are unable to petition the castaways they receive.',
      '➤ Players that sign up for a private league should expect their hosts to properly communicate and implement all draft policies and deadlines. Trekkon Fantasy Leagues is not responsible for issuing refunds if private league hosts fail to perform their expected duties. That is to say, before joining a league, make sure you trust the host to lead responsibly throughout the league.',
    ],
    trades: [
      '➤ Every player, regardless of membership tier, can propose and accept trades.',
            '➤ League hosts may be asked to manually confirm trades in their league before they\u2019re official.',
'➤ Castaways can be traded, as long as they\u2019re still in the game, from the time tribes are announced until the start of Final Tribal Council.',
       '➤ Individual castaways cannot be included in more than one trade offer at a time.',
       '➤ Trade offers do not expire; they sit until accepted, declined, or withdrawn by sender.',
      '➤ If trades are declined, either party is welcome to re-submit a juicy new offer.',
            '➤ If a player leaves the league midseason, any active castaways enter into waiver wire after 12 hours for player to claim in exchange for another currently-active player.',
    '➤ Each player should act in their own self-interest to finish as high as possible in the season-end standings. Out-of-contention players should respect the spirit of the league by not choosing who they want to win ("King Building").',
'➤ If players are caught manipulating trades with multiple accounts or friends, they will be banned from current and future league participation.',
],
  },
}

export default function DraftPage() {
  const params = useParams()
  const type = params.type as string
  const content = draftContent[type]

  if (!content) {
    return (
      <main style={{
        backgroundColor: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a0a0b0',
        fontFamily: 'Georgia, serif',
        gap: '16px'
      }}>
        <p>Draft & trade info for this league isn&apos;t posted yet.</p>
        <a href={`/leagues/${type}`} style={{ color: '#f0b429' }}>← Back to 🌴 Politics on the Beach</a>
      </main>
    )
  }

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '60px 40px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <a href={`/leagues/${type}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to 🌴 {content.leagueName}
        </a>

        <h1 style={{ fontSize: '2.25rem', marginBottom: '10px' }}>
          📋 <span style={{ color: '#f0b429' }}>{content.leagueName}</span>{' '}
          <span style={{ color: '#ffffff' }}>Drafting & Trading</span>
        </h1>

        <div style={{ marginBottom: '36px' }}>
          {content.intro.map((para, i) => (
            <p key={i} style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.45', marginBottom: '12px' }}>
              {para}
            </p>
          ))}
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px' }}>
            📅 Key League Dates
          </h2>
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #2a2a3e',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            {content.draftWindow.map((row, i) => (
              <div key={row.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: i < content.draftWindow.length - 1 ? '1px solid #2a2a3e' : 'none',
                flexWrap: 'wrap',
                gap: '4px'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f0b429' }}>{row.label}</div>
                <div style={{ fontSize: '0.9rem', color: '#a0a0b0' }}>{row.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px' }}>
            🐍 Offline Draft Procedures (Public)
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
          <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px' }}>
            🔒 Live Draft Procedures (Private)
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
          <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px' }}>
            🔄 Trade Procedures
          </h2>
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #2a2a3e',
            borderRadius: '10px',
            padding: '20px'
          }}>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.45' }}>
              {content.trades.map((line, i) => (
                <li key={i} style={{ marginBottom: '12px' }}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </main>
  )
}