'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { themeContentBySkin } from '@/lib/social-game/themeContent'
import { ChessKnight } from 'lucide-react'
import { createGame, listOpenGames, joinGame, joinPrivateGame, checkHostEligibility, type OpenGame } from '@/lib/social-game/lobbyActions'

const selectableSkins = ['island', 'traitors', 'f1', 'nascar']

export default function SocialGameLandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [openGames, setOpenGames] = useState<OpenGame[]>([])
  const [showHostPicker, setShowHostPicker] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null)
  const [joinCodeInput, setJoinCodeInput] = useState<Record<number, string>>({})
  const [joiningId, setJoiningId] = useState<number | null>(null)

  useEffect(() => {
    async function loadGames() {
      const games = await listOpenGames()
      setOpenGames(games)
    }
    loadGames()
    const interval = setInterval(loadGames, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleShowHostPicker = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    const eligibility = await checkHostEligibility(user.id)
    setFreeRemaining(eligibility.freeRemaining)
    if (!eligibility.canHost) {
      setError(eligibility.reason ?? 'Unable to host right now.')
      return
    }
    setError('')
    setShowHostPicker(true)
  }

  const handleCreate = async (skin: string, isPrivate: boolean) => {
    if (!user) return
    setCreating(true)
    setError('')
    const { gameId, error: createError } = await createGame(user.id, skin, isPrivate)
    setCreating(false)
    if (createError || !gameId) {
      setError(createError ?? 'Something went wrong.')
      return
    }
    router.push(`/social-game/${gameId}`)
  }

  const handleJoinPublic = async (gameId: number) => {
    if (!user) {
      router.push('/login')
      return
    }
    setJoiningId(gameId)
    const { error: joinError } = await joinGame(gameId, user.id)
    setJoiningId(null)
    if (joinError) {
      setError(joinError)
      return
    }
    router.push(`/social-game/${gameId}`)
  }

  const handleJoinPrivate = async (gameId: number) => {
    if (!user) {
      router.push('/login')
      return
    }
    const code = joinCodeInput[gameId] ?? ''
    setJoiningId(gameId)
    const { error: joinError } = await joinPrivateGame(gameId, code, user.id)
    setJoiningId(null)
    if (joinError) {
      setError(joinError)
      return
    }
    router.push(`/social-game/${gameId}`)
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Back to Trekkon Fantasy Leagues
        </a>

         <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <ChessKnight size={36} strokeWidth={2} color="#f0b429" style={{ position: 'relative', top: '-1px' }} />
  <span style={{ color: '#f0b429' }}>Social Deduction</span>{' '}
  <span style={{ color: '#ffffff' }}>Mini-Game</span>
</h1>

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '4px' }}>
  Watching is fun, but have you ever wondered if you have what it takes to <em>play</em> the game? </p>

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '32px' }}>
  Though we certainly recommend honesty, kindness, and integrity in the real world, this entry-level social deduction game is a great place to test your lying, deceiving, and backstabbing accumen.
</p>

        <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '4px' }}>Basic Game Mechanics</h2>

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '4px' }}>
  Watching is fun, but have you ever wondered if you have what it takes to <em>play</em> the game? </p>

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '16px' }}>
  Though we certainly recommend honesty, kindness, and integrity in the real world, this entry-level social deduction game is a great place to test your lying, deceiving, and backstabbing accumen.
</p>

        <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '4px' }}>Host a Game</h2>

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '4px' }}>
  Watching is fun, but have you ever wondered if you have what it takes to <em>play</em> the game? </p>

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '16px' }}>
  Try this entry-level social deduction game if you want to hone your lying, deceiving, and backstabbing accumen. Keep in mind, we only recommend using these skills in-game! Please maintain honesty and kindness with your family, friends, co-workers, and hairstylist!
</p>

        {!showHostPicker ? (
          <button
            onClick={handleShowHostPicker}
            style={{
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '12px 28px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            Host a Game
          </button>
        ) : (
          <div style={{ marginBottom: '16px' }}>
           {freeRemaining !== null && freeRemaining > 0 && (
  <p style={{ color: '#555570', fontSize: '0.85rem', marginBottom: '16px' }}>
    {freeRemaining} free hosting session{freeRemaining === 1 ? '' : 's'} remaining.
  </p>
)}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {selectableSkins.map((skin) => {
                const theme = themeContentBySkin[skin]
                return (
                  <div key={skin} style={{
                    backgroundColor: '#1a1a2e',
                    border: '2px solid #f0b429',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '10px' }}>
                      {theme.emoji} {theme.displayName}
                    </h2>
                    <p style={{ color: '#a0a0b0', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '18px' }}>
                      {theme.intro}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleCreate(skin, false)}
                        disabled={creating}
                        style={{
                          flex: 1, backgroundColor: '#f0b429', color: '#0a0a0f', padding: '10px',
                          borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem',
                          cursor: creating ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Public
                      </button>
                      <button
                        onClick={() => handleCreate(skin, true)}
                        disabled={creating}
                        style={{
                          flex: 1, backgroundColor: 'transparent', color: '#f0b429', border: '1px solid #f0b429',
                          padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem',
                          cursor: creating ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Private
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {error && <p style={{ color: '#ff6b6b', marginBottom: '24px' }}>{error}</p>}

        <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '4px' }}>Current Games</h2>
        {openGames.length === 0 ? (
          <p style={{ color: '#555570' }}>No games running right now — be the first to host one!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {openGames.map((g) => {
              const theme = themeContentBySkin[g.skin]
              return (
                <div key={g.id} style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{theme.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{g.display_name}</div>
                      <div style={{ color: '#a0a0b0', fontSize: '0.8rem' }}>
                        {g.player_count}/10 players {g.is_private ? '🔒 Private' : ''}
                      </div>
                    </div>
                  </div>

                  {g.is_private ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Join code"
                        value={joinCodeInput[g.id] ?? ''}
                        onChange={(e) => setJoinCodeInput((prev) => ({ ...prev, [g.id]: e.target.value }))}
                        style={{
                          padding: '8px 10px', borderRadius: '6px', border: '1px solid #2a2a3e',
                          backgroundColor: '#12121a', color: '#ffffff', fontSize: '0.85rem', width: '110px'
                        }}
                      />
                      <button
                        onClick={() => handleJoinPrivate(g.id)}
                        disabled={joiningId === g.id}
                        style={{
                          backgroundColor: '#f0b429', color: '#0a0a0f', padding: '8px 16px',
                          borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Join
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoinPublic(g.id)}
                      disabled={joiningId === g.id || g.player_count >= 10}
                      style={{
                        backgroundColor: '#f0b429', color: '#0a0a0f', padding: '8px 20px',
                        borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem',
                        cursor: g.player_count >= 10 ? 'not-allowed' : 'pointer',
                        opacity: g.player_count >= 10 ? 0.5 : 1
                      }}
                    >
                      {g.player_count >= 10 ? 'Full' : 'Watch / Join'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}