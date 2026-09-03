'use client'

import { useParams } from 'next/navigation'

type ScoringRow = {
  event: string
  points: string
  notes?: string[]
}

const rulesContent: Record<string, {
  leagueName: string
  intro: string[]
  sections: { title: string; rows: ScoringRow[] }[]
  tiebreaker: string[]
  closing?: string
}> = {
  'politics-on-the-beach': {
    leagueName: 'Politics on the Beach',
    intro: [
      'Trekkon Fantasy Leagues is all about keeping our leagues simple and players\u2019 viewing experience pure. We do not want to, as a wise soul before television wrote, "murder to dissect" trying to annotate every worm eaten, tear shed, and blindside planned. Leave the tabulations to us, then, and focus on restocking your watch party\u2019s bean dip, enjoying the island politics, and "Thursday Morning Quarterbacking" in the group chat.',
      'When our beloved franchise throws us twists and turns – looking at you Billie Eilish – please trust our team will do our best to arbitrate according to both the letter and spirit of the law.',
    ],
    sections: [
      {
        title: 'Challenge Performances',
        rows: [
          {
            event: 'Reward Challenge Win',
            points: '0',
            notes: ['Castaways\u2019 reward is food or gear, which should fuel them to score points in other ways.'],
          },
          {
            event: 'Immunity Challenge Safety (Team)',
            points: '+5',
            notes: ['If the first loser in a three-tribe challenge saves themselves from Tribal Council.'],
          },
          {
            event: 'Immunity Challenge Win (Team)',
            points: '+8'
          },
          
          {
            event: 'Immunity Challenge Win (Individual)',
            points: '+15',
            notes: ['Counted for each player wearing a necklace.'],
          },
        ],
      },
      {
        title: 'Idol Shenanigans',
        rows: [
          {
            event: 'Advantage Found',
            points: '0',
            notes: ['If used correctly, advantages should help castaways advance in the game and score points in other categories.'],
          },
          {
            event: 'Idol in Possession | Addended for Billie',
            points: '+10',
            notes: ['Castaways do not lose points if the idol is given, freely or forcibly, to another player; if passed around, points abound.'],
          },
          {
            event: 'Successful Idol Play',
            points: '+15',
            notes: ['Successful = Player with the most votes (or tied) does not go home because of the idol (i.e. it needed to be played).'],
          },
          {
            event: 'Leave with Idol-in-Pocket',
            points: '\u221220',
            notes: ['The cardinal sin of Survivor. Enjoy your million dollar souvenir!'],
          },
        ],
      },
      {
        title: 'Tribal Councils & Exits',
        rows: [
          {
            event: 'First Player to Leave Starter Tribe',
            points: '\u221210',
            notes: [
              'This could be vote off, med-evac, etc.',
              'No longer relevant after a swap, switch, merge, etc.',
            ],
          },
          {
            event: '\u201cFirst Boot\u201d (Player Voted Off Island)',
            points: '\u221210',
            notes: ['Will likely stack with the above (i.e. \u221220 points to first vote off) but accidents happen, Bruce.'],
          },
          {
            event: 'Every Vote (Against) at Tribal',
            points: '\u22122',
            notes: [
              'If the votes are nullified with an idol, they do not count toward this total.',
            ],
          },
          {
            event: 'Survived Tribal Council Cycle',
            points: '+5',
            notes: [
              'If multiple castaways get voted off after one challenge, this counts as one cycle.',
              'This does not necessarily mean episodes (e.g. finale could have 5-6 players with multiple cycles/rounds survived).'
            ],
          },
        ],
      },
      {
        title: 'Merge & End Game',
        rows: [
          {
            event: 'Make the [Official] Merge',
            points: '+10',
            notes: ['\u201cMergatory\u201d does not count; must get an official merge buff.'],
          },
          { event: 'Make Final Tribal', points: '+20' },
          { event: 'Win Sole Survivor', points: '+25' },
          { event: '0-Vote Finalist (Goat)', points: '\u221210' },
        ],
      },
    ],
    tiebreaker: [
      'In the event of a season-end tie (whether tribes have the same three scored players or different combinations), tie breakers will be as follows: 1) Whose first-round draft pick scored more points? 2) Second? 3) Third? 4) \u201cBench player\u201d?',
    ] },
}

export default function RulesPage() {
  const params = useParams()
  const type = params.type as string
  const content = rulesContent[type]

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
        <p>Rules for this league aren&apos;t posted yet.</p>
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

       <h1 style={{ fontSize: 'clamp(1.85rem, 8vw, 2.25rem)', marginBottom: '24px' }}>
  📜 <span style={{ color: '#f0b429' }}>{content.leagueName}</span>{' '}
  <span style={{ color: '#ffffff' }}>Rules & Scoring</span>
</h1>

        <div style={{ marginBottom: '36px' }}>
          {content.intro.map((para, i) => (
            <p key={i} style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '12px' }}>
              {para}
            </p>
          ))}
        </div>

        {content.sections.map((section) => (
          <div key={section.title} style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '12px' }}>
              {section.title}
            </h2>
            <div style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #2a2a3e',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              {section.rows.map((row, i) => (
                <div key={row.event} style={{
                  padding: '14px 20px',
                  borderBottom: i < section.rows.length - 1 ? '1px solid #2a2a3e' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.95rem' }}>
  {row.event.includes('|') ? (
    <>
      {row.event.split('|')[0].trim()}
      {' | '}
      <em>{row.event.split('|')[1].trim()}</em>
    </>
  ) : (
    row.event
  )}
</div>
                    <div style={{
                      color: row.points.startsWith('\u2212') ? '#ff6b6b' : row.points === '0' ? '#a0a0b0' : '#f0b429',
                      fontWeight: 'bold',
                      fontSize: '1.05rem',
                      whiteSpace: 'nowrap',
                      marginLeft: '16px'
                    }}>
                      {row.points} {row.points !== '0' ? 'points' : 'points'}
                    </div>
                  </div>
                  {row.notes && row.notes.map((note, ni) => (
                    <div key={ni} style={{ color: '#555570', fontSize: '0.8rem', marginTop: '4px', paddingLeft: '4px' }}>
                      — {note}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '32px'
        }}>
          <h2 style={{ color: '#f0b429', fontSize: '1.1rem', marginBottom: '8px', textAlign: 'center' }}>
            🤝 Tie Breaker Procedure
          </h2>
      {content.tiebreaker.map((line, i) => {
  const [before, after] = line.split(/:(.+)/)
  return (
    <p key={i} style={{ color: '#a0a0b0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '6px' }}>
      {before}:{after ? <em>{after}</em> : null}
    </p>
  )
})}
        </div>

        <p style={{ color: '#555570', fontSize: '0.9rem', textAlign: 'center' }}>
          {content.closing}
        </p>

      </div>
    </main>
  )
}