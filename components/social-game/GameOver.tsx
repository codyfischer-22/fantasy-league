'use client'

import { useRouter } from 'next/navigation'
import { roleTermsBySkin } from '@/lib/social-game/roles'
import { useState } from 'react'
import ReportPlayerModal from './ReportPlayerModal'

type SeatPlayer = {
  user_id: string
  seat_order: number
  display_name: string
  role: string
}

type Props = {
  skin: string
  status: string
  players: SeatPlayer[]
  captainGuessTarget: string | null
  gameId: number
  myUserId: string
}

export default function GameOver({ skin, status, players, captainGuessTarget, gameId, myUserId }: Props) {
  const router = useRouter()
  const terms = roleTermsBySkin[skin]
  const evilWon = status === 'evil_wins'
  const wonByGuess = evilWon && captainGuessTarget !== null
  const themeColor = evilWon ? '#ff6b6b' : '#068e38'
  const [reportTarget, setReportTarget] = useState<string | null>(null)

  const roleLabel: Record<string, string> = {
    goodCaptain: terms.goodCaptain,
    badCaptain: terms.badCaptain,
    goodTeamMember: terms.goodTeamMember,
    badTeamMember: terms.badTeamMember,
  }

  return (
    <div style={{ position: 'relative', minHeight: '70vh', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${themeColor}2e 0%, ${themeColor}10 35%, transparent 70%)`,
        pointerEvents: 'none',
        animation: 'pulseGlow 3s ease-in-out infinite'
      }} />

      {[...Array(14)].map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: `${Math.random() * 60}%`,
            left: `${5 + Math.random() * 90}%`,
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: themeColor,
            opacity: 0.5,
            pointerEvents: 'none',
            animation: `floatUp ${3 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`
          }}
        />
      ))}

      <div style={{ position: 'relative', maxWidth: '460px', margin: '0 auto', textAlign: 'center', zIndex: 1 }}>
        <p style={{
          color: themeColor,
          fontSize: '0.8rem',
          fontWeight: 'bold',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          marginBottom: '8px',
          marginTop: '40px'
        }}>
          Game Over
        </p>

        <h2 style={{
          color: themeColor,
          fontSize: '1.3rem',
          fontWeight: 'bold',
          marginBottom: '8px',
          textShadow: `0 0 30px ${themeColor}88, 0 0 60px ${themeColor}44`,
          animation: 'titlePulse 2.5s ease-in-out infinite'
        }}>
          {evilWon ? `${terms.badCaptain} and ${terms.badTeamMember}s Win!` : `${terms.goodCaptain} and ${terms.goodTeamMember}s Win!`}
        </h2>

        <div style={{
          width: '70px',
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)`,
          margin: '16px auto 20px auto'
        }} />

        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px' }}>
          {wonByGuess
            ? `The ${terms.badCaptain} correctly identified the ${terms.goodCaptain}.`
            : evilWon
            ? `${terms.badTeam} weasled their way in to ${terms.failMission} 3 times.`
            : `They stepped up in 3 ${terms.mission}s, without giving away their ${terms.goodCaptain}.`}
        </p>

        <h3 style={{
          color: '#f0b429',
          fontSize: '1rem',
          fontWeight: 'bold',
          marginBottom: '14px'
        }}>
          Did you have everyone&apos;s roles pegged?
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          {players.map((p, i) => {
            const isEvil = p.role === 'badCaptain' || p.role === 'badTeamMember'
            const isCaptain = p.role === 'goodCaptain' || p.role === 'badCaptain'
            return (
              <div
                key={p.user_id}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: `1.5px solid ${isEvil ? '#ff6b6b' : '#2a2a3e'}`,
                  borderRadius: '10px',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  boxShadow: isCaptain && isEvil === evilWon ? `0 0 16px 2px ${themeColor}59` : 'none',
                  opacity: 0,
                  animation: `fadeInUp 0.45s ease ${0.3 + i * 0.1}s forwards`
                }}
              >
                <span style={{ fontSize: '.85rem', fontWeight: isCaptain ? 'bold' : 'normal' }}>{p.display_name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    color: isEvil ? '#ff6b6b' : '#a0a0b0',
                    fontWeight: isCaptain ? 'bold' : 'normal',
                    fontSize: '.85rem'
                  }}>
                    {isCaptain && ' '}{roleLabel[p.role]}
                  </span>
                  {p.user_id !== myUserId && (
                    <button
                      onClick={() => setReportTarget(p.user_id)}
                      style={{ background: 'none', border: 'none', color: '#555570', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      🚩
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => router.push('/social-game')}
          style={{
            backgroundColor: '#f0b429', color: '#0a0a0f', padding: '12px 32px',
            borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem',
            cursor: 'pointer', boxShadow: '0 4px 18px rgba(240,180,41,0.35)',
            marginBottom: '40px'
          }}
        >
          ← Back to Game Lobby
        </button>
      </div>

      {reportTarget && (
        <ReportPlayerModal
          gameId={gameId}
          reporterUserId={myUserId}
          players={players.filter((p) => p.user_id === reportTarget)}
          onClose={() => setReportTarget(null)}
        />
      )}

      <style jsx>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.08); }
        }
        @keyframes titlePulse {
          0%, 100% { text-shadow: 0 0 30px ${themeColor}88, 0 0 60px ${themeColor}44; }
          50% { text-shadow: 0 0 40px ${themeColor}aa, 0 0 80px ${themeColor}66; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}