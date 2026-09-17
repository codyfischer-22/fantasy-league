'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ScrollText, Dices } from 'lucide-react'

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
  'secrets-on-the-beach': {
    leagueName: 'Secrets on the Beach',
    intro: [
      'Trekkon Fantasy Leagues is all about keeping our leagues simple and players\u2019 viewing experience pure. We do not want to – as a wise soul once wrote – "murder to dissect," trying to annotate every worm eaten, tear shed, and blindside planned. Leave the tabulations to us, then, and focus on restocking your watch party\u2019s bean dip, enjoying the island politics, and "Thursday Morning Quarterbacking" in the group chat.',
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
    ]
  },
  'uncharted-turretory': {
    leagueName: 'Uncharted Turretory',
    intro: [
      'Trekkon Fantasy Leagues is all about keeping our leagues simple and players\u2019 viewing experience pure. Leave the tabulations to us, then, and focus on the roundtable drama, refilling your goblet, and "Friday Morning Quarterbacking" in the group chat.',
      'When the show throws us a twist we didn\u2019t see coming, please trust our team will arbitrate according to both the letter and spirit of the law.',
    ],
    sections: [
      {
        title: 'Mission Performances',
        rows: [
          { event: 'Group Earns $5,000',
            points: '+2',
            notes: ['Stacks with each $5K increment. Contestant must be in the group that earned the prize.'],
          },
          {event: 'Shield (Team)',
            points: '+5',
            notes: ['Shield earned by a team for a collective prize.']
          },
          { event: 'Shield (Personal)',
            points: '+10',
            notes: ['Player finds and secures immunity on a mission.']
          },
          { event: 'Dagger',
            points: '+10',
            notes: ['Player finds and secures extra vote on a mission.']
          },
        ],
      },
      {
        title: 'Tumult in the Turret',
        rows: [
          {
            event: 'Murdered',
            points: '\u22128'
          },
          {
            event: 'Murdered in Plain Sight',
            points: '\u221215',
            notes: ['Player must interact with or fall into traitor trap (not just name in hat or witness murder.)']
          },
          {
            event: 'Shielded from Murder',
            points: '+15',
            notes: ['Player would have died were it not for their shield.']
          }
        ],
      },
      {
        title: 'Round Table Ramblings',
        rows: [
          {
            event: 'First Banished',
            points: '\u22125',
            notes: ['Stacks with the penalty below. It had to be someone but why\u2019d you let it be you?']
          },
          {
            event: 'Banished at Round Table',
            points: '\u221210',
            notes: ['Regardless of whether player is faithful or traitor.']
          },
          {
            event: 'Successful Dagger',
            points: '+15',
            notes: ['If extra vote makes the difference in a player going home.']
          }
        ],
      },
      {
        title: 'End Game',
        rows: [
          { event: 'Make Fire of Truth', points: '+15' },
          { event: 'Banished at Fire of Truth',
            points: '\u221210',
          },
          {event: '4-Player Win', points: '+10' },
          {event: '3-Player Win', points: '+15' },
          { event: '2-Player Win', points: '+20' },
          { event: '1-Player Win', points: '+25' },
        ],
      },
    ],
    tiebreaker: [
      'In the event of a season-end tie, tie breakers will be as follows: 1) Whose first-round draft pick scored more points? 2) Second? 3) Third? 4) \u201cBench player\u201d?',
    ],
  },
}

const ruleTypeOptions = [
  { value: 'secrets-on-the-beach', label: '🏝️ Secrets on the Beach', comingSoon: false },
  { value: 'uncharted-turretory', label: '🗡️ Uncharted Turretory', comingSoon: false },
  { value: 'paddock-politicks', label: '🏎️ Paddock Politicks', comingSoon: true },
  { value: 'the-oval-offset', label: '🚗 The Oval Offset', comingSoon: true },
]
export default function RulesPage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string | undefined
  const content = type ? rulesContent[type] : null
  const [showComingSoon, setShowComingSoon] = useState(false)

  const handleRuleTypeChange = (selectedType: string) => {
    const option = ruleTypeOptions.find((opt) => opt.value === selectedType)
    if (option?.comingSoon) {
      setShowComingSoon(true)
      return
    }
    router.push(`/leagues/${selectedType}/rules`)
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
  <ScrollText size={32} strokeWidth={2} color="#f0b429" style={{ flexShrink: 0 }} />
  <span style={{ color: '#f0b429' }}>Trekkon</span>
  <span style={{ color: '#ffffff' }}>Rules & Scoring</span>
</h1>

{!content && (
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '8px' }}>
            View "Rules & Scoring" for the following league:
          </label>
         <select
  value={type === 'all' ? '' : type ?? ''}
  onChange={(e) => handleRuleTypeChange(e.target.value)}
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
  {ruleTypeOptions.map((opt) => (
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
    <p key={i} style={{ color: '#a0a0b0', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '12px' }}>
      {para}
    </p>
  ))}
</div>

<div style={{ marginBottom: '32px' }}>
  <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
        Check out "Rules & Scoring" for another league:
      </label>
      <select
        value={type ?? ''}
        onChange={(e) => handleRuleTypeChange(e.target.value)}
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
        {ruleTypeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}{opt.comingSoon ? ' (Coming Soon)' : ''}
          </option>
        ))}
      </select>
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
                          {row.points} {row.points !== '0' ? 'Points' : 'Points'}
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
              <h2 style={{ color: '#f0b429', fontSize: '1.1rem', marginBottom: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Dices size={22} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '0px' }} />
                Tie Breaker Procedure
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
              We&apos;re sorry! The track is still being paved. Try back soon for our new racing leagues!      </p>

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