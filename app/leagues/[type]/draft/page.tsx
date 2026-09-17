'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Lock, ListOrdered, RefreshCw, Calendar, ClipboardList } from 'lucide-react'

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
  'secrets-on-the-beach': {
    leagueName: 'Secrets on the Beach',
    intro: [
      'Here\u2019s everything you need before the draft window \u2014 timing, format, and how trades work once your roster is set.',
    ],
    draftWindow: [
      { label: 'Signup Deadline', detail: 'Sunday, September 13, 11:59 PM' },
      { label: 'Draft Rankings Due (Public)', detail: 'Tuesday, September 15, 5 PM' },
      { label: 'Draft Order Set', detail: 'Tuesday, September 15, 7 PM\n\u2013 Wednesday, September 16, 5 PM' },
      { label: 'Draft Window', detail: 'Wednesday, September 16, 7 PM\n\u2013 Sunday, September 20, 7 PM' },
      { label: 'Episode 1 Airs', detail: 'Wednesday, September 23, 7 PM' },
    ],
    draftFormatPublic: [
      '➤ Given the high level of participation we expect across public leagues, we will implement an offline draft where each player ranks the order in which they would draft castaways if available:',
      '"I would take 1) Attractive Alex, 2) Smarty Pants Perry, 3) Beef Cake Casey . . . 21) Snivelling Sam."',
      '➤ Every castaway will be "cloned" as necessary so each player can have a tribe of 4.',
      '(If there are 100 players in the league, we would need 400 unique castaways to draft. With 21 real-life castaways, they would each be cloned 20 times to make 420 draftable league castaways.)',
      '➤ The order in which players draft for public leagues is randomly assigned.',
      '➤ Players failing to submit castaway rankings by the deadline above will have them automatically submitted in a randomized order without petition.',
      '➤ In the draft window noted above, Trekkon Fantasy Leagues will use rankings to simulate a snake draft.',
      '(In Round 1, Player 1 will draft before Players 2, 3, 4 . . . 100. After the last player drafts, Round 2 will begin in reverse order \u2014 Players 100, 99, 98 . . . 3, 2, 1. This "snaking" continues until all 4 draft rounds are complete and ensures each player gets high- and low-level choices.)',
      '➤ Simulated draft results are final once shared; if players don\u2019t get their top choices, it\u2019s because those castaways were popular and ran out before their turn.',
      '➤ Don\u2019t like your 4-person tribe? Time to get trading!',
    ],
    draftFormatPrivate: [
      '➤ Live draft order is randomly generated, but league hosts may manually adjust at their discretion.',
      '➤ Private league hosts are responsible for manually starting the live snake draft.',
      '➤ Private league hosts are responsible for selecting and communicating live draft time limits (from 2 minutes to 3 hours per pick).',
      '➤ Players get time warning notifications at 10, 5, and 1 minutes remaining in their live draft pick.',
      '➤ If a draft pick timer runs out, the host decides if that player\u2019s pick is A) skipped and moved to the end of the live draft or B) assigned a randomly-generated player on the draft board.',
      '➤ If the live draft is not completed by the window above, league hosts or Trekkon Fantasy Leagues ensure all players have 4 castaways on their tribe. Players failing to adhere to draft procedures outlined by the league host are unable to petition the castaways they receive.',
      '➤ Players that sign up for a private league should expect their hosts to properly communicate and implement all draft policies and deadlines. Trekkon Fantasy Leagues is not responsible for issuing refunds if private league hosts fail to perform their expected duties. That is to say, before joining a league, make sure you trust the host to lead responsibly throughout the league.',
    ],
    trades: [
      '➤ Every player, regardless of membership tier, can propose and accept trades.',
      '➤ League hosts may elect to manually confirm trades in their league before they\u2019re official.',
      '➤ Castaways can be traded, as long as they\u2019re still in the game, from the time tribes are announced until the penultimate episode\u2019s scores are in.',
      '➤ Individual castaways cannot be included in more than one trade offer at a time.',
      '➤ Trade offers do not expire; they sit until accepted, declined, or withdrawn by sender.',
      '➤ If trades are declined, either party is welcome to re-submit a juicy new offer.',
      '➤ Players must act in their own self-interest to finish well in season-end standings. Out-of-contention players should not "give away" players to help others win ("King Building").',
      '➤ If players are caught manipulating trades with multiple accounts or friends, they will be banned from current and future league participation.',
    ],
  },
  'uncharted-turretory': {
    leagueName: 'Uncharted Turretory',
    intro: [
      'Here\u2019s everything you need before the draft window \u2014 timing, format, and how trades work once your roster is set.',
    ],
    draftWindow: [
      { label: 'Signup Deadline', detail: 'Tuesday, September 15, 11:59 PM' },
      { label: 'Draft Rankings Due (Public)', detail: 'Wednesday, September 16, 5 PM' },
      { label: 'Draft Window', detail: 'Wednesday, September 16, 7 PM \n\u2013 Thursday, September 17, 5 PM' },
      { label: 'Episode 1 Airs', detail: 'Thursday, September 17, 7 PM' },
    ],
    draftFormatPublic: [
      '➤ Given the high level of participation we expect across public leagues, we will implement an offline draft where each player ranks the order in which they would draft castle-goers if available:',
      '"I would take 1) Attractive Alex, 2) Smarty Pants Perry, 3) Beef Cake Casey . . . 21) Snivelling Sam."',
      '➤ Every castle-goer will be "cloned" as necessary so each player can have a roster of 4.',
      '(If there are 10 players in the league, we would need 40 unique castle-goers to draft. With 22 real-life castle-goers, they would each be cloned 3 times to make 66 draftable contestants.)',
      '➤ The order in which players draft for public leagues is randomly assigned.',
      '➤ Players failing to submit castle-goer rankings by the deadline above will have them automatically submitted in a randomized order without petition.',
      '➤ In the draft window noted above, Trekkon Fantasy Leagues will use rankings to simulate a snake draft.',
      '(In Round 1, Player 1 will draft before Players 2, 3, 4 . . . 10. After the last player drafts, Round 2 will begin in reverse order \u2014 Players 10, 9, 8 . . . 3, 2, 1. This "snaking" continues until all 4 draft rounds are complete and ensures each player gets high- and low-level choices.)',
      '➤ Simulated draft results are final once shared; if players don\u2019t get their top choices, it\u2019s because those castle-goers were popular and ran out before their turn.',
      '➤ Don\u2019t like your 4-person roster? Time to get trading!',
    ],
    draftFormatPrivate: [
      '➤ Live draft order is randomly generated, but league hosts may manually adjust at their discretion.',
      '➤ Private league hosts are responsible for manually starting the live snake draft.',
      '➤ Private league hosts are responsible for selecting and communicating live draft time limits (from 2 minutes to 3 hours per pick).',
      '➤ Players get time warning notifications at 10, 5, and 1 minutes remaining in their live draft pick.',
      '➤ If a draft pick timer runs out, the host decides if that player\u2019s pick is A) skipped and moved to the end of the live draft or B) assigned a randomly-generated player on the draft board.',
      '➤ If the live draft is not completed by the window above, league hosts or Trekkon Fantasy Leagues ensure all players have 4 castle-goers on their roster. Players failing to adhere to draft procedures outlined by the league host are unable to petition the castle-goers they receive.',
      '➤ Players that sign up for a private league should expect their hosts to properly communicate and implement all draft policies and deadlines. Trekkon Fantasy Leagues is not responsible for issuing refunds if private league hosts fail to perform their expected duties. That is to say, before joining a league, make sure you trust the host to lead responsibly throughout the league.',
    ],
    trades: [
      '➤ Every player, regardless of membership tier, can propose and accept trades.',
      '➤ League hosts may elect to manually confirm trades in their league before they\u2019re official.',
      '➤ Castle-goers can be traded, as long as they\u2019re still in the game, from the time rosters are announced until the penultimate episode\u2019s scores are in.',
      '➤ Individual castle-goers cannot be included in more than one trade offer at a time.',
      '➤ Trade offers do not expire; they sit until accepted, declined, or withdrawn by sender.',
      '➤ If trades are declined, either party is welcome to re-submit a juicy new offer.',
      '➤ Players must act in their own self-interest to finish well in season-end standings. Out-of-contention players should not "give away" players to help others win ("King Building").',
      '➤ If players are caught manipulating trades with multiple accounts or friends, they will be banned from current and future league participation.',
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
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px 10px'
}}>
  <ListOrdered size={32} strokeWidth={2} color="#f0b429" style={{ flexShrink: 0 }} />
          <span style={{ color: '#f0b429' }}>Trekkon</span>{' '}
          <span style={{ color: '#ffffff' }}>Draft & Trading</span>
        </h1>

        {!content && (
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '8px' }}>
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
            <div style={{ marginBottom: '14px' }}>
              {content.intro.map((para, i) => (
                <p key={i} style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.45', marginBottom: '12px' }}>
                  {para}
                </p>
              ))}
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

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={22} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '0px' }} />
                Key League Dates
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
                    <div className="draft-date-detail" style={{ fontSize: '0.9rem', color: '#a0a0b0' }}>{row.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ color: '#4a4a61', textAlign: 'center', fontSize: '.95rem', lineHeight: '1.2', marginTop: '-20px', marginBottom: '32px' }}>
              <i>Private deadlines at league host discretion. Public deadlines follow Central Time (CT). </i>
            </p>

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
                padding: '20px'
              }}>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.45' }}>
                  {content.trades.map((line, i) => (
                    <li key={i} style={{ marginBottom: '12px' }}>{line}</li>
                  ))}
                </ul>
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