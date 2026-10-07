'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { themeContentBySkin } from '@/lib/social-game/themeContent'
import { PlayingCardsFan, Rat, Rocket, Anchor, Drill  } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createGame, listOpenGames, joinGame, joinPrivateGame, checkHostEligibility, type OpenGame } from '@/lib/social-game/lobbyActions'

const selectableSkins = ['island', 'traitors', 'f1', 'nascar', 'neutral']

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
  const [activeSkinTab, setActiveSkinTab] = useState<string | null>(null)
  const [pendingCreate, setPendingCreate] = useState<{ skin: string; isPrivate: boolean } | null>(null)
  const [myGameIds, setMyGameIds] = useState<Set<number>>(new Set())
  const [privateJoinError, setPrivateJoinError] = useState<Record<number, string>>({})
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

useEffect(() => {
  setIsMobile(window.innerWidth < 768)
}, [])

useEffect(() => {
  async function loadMyGames() {
    if (!user) {
      setMyGameIds(new Set())
      return
    }
    const { data } = await supabase
      .from('social_game_players')
      .select('game_id')
      .eq('user_id', user.id)
    setMyGameIds(new Set((data ?? []).map((r) => r.game_id)))
  }
  loadMyGames()
  const interval = setInterval(loadMyGames, 3000)
  return () => clearInterval(interval)
}, [user])

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
     setActiveSkinTab(selectableSkins[0] ?? null)
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

const handleJoinPublic = async (game: OpenGame) => {
  if (!user) {
    router.push('/login')
    return
  }
  if (game.status !== 'lobby') {
    router.push(`/social-game/${game.id}`)
    return
  }
  setJoiningId(game.id)
  const { error: joinError } = await joinGame(game.id, user.id)
  setJoiningId(null)
  if (joinError) {
    setError(joinError)
    return
  }
  router.push(`/social-game/${game.id}`)
}

 const handleJoinPrivate = async (gameId: number) => {
  if (!user) {
    router.push('/login')
    return
  }
  const code = joinCodeInput[gameId] ?? ''
  setJoiningId(gameId)
  setPrivateJoinError((prev) => ({ ...prev, [gameId]: '' }))
  const { error: joinError } = await joinPrivateGame(gameId, code, user.id)
  setJoiningId(null)
  if (joinError) {
    setPrivateJoinError((prev) => ({ ...prev, [gameId]: joinError }))
    setTimeout(() => {
      setPrivateJoinError((prev) => ({ ...prev, [gameId]: '' }))
    }, 5000)
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
  <PlayingCardsFan size={40} strokeWidth={1.5} color="#f0b429" style={{ position: 'relative', top: '-1px' }} />
  <span style={{ color: '#f0b429' }}>Get in the Game</span>{' '}
  <span style={{ color: '#ffffff' }}>Lobby</span>
</h1>

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '4px' }}>
  Watching is fun, but have you ever wondered if you have what it takes to <em>play</em> the game? </p>

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px' }}>
  Though we certainly recommend honesty, kindness, and integrity in the real world, this entry-level social deduction game is a great place to test your lying, deceiving, and backstabbing accumen.
</p>

        <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '4px' }}>Basic Game Mechanics</h2>

<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '12px' }}>
 5-10 players are randomly assigned factions, where they compete in a series of missions. Evil players know their teammates and win by failing 3 missions. Good players win by passing 3 missions... if evil cannot guess their leader, that is. The good leader holds all the cards, knowing everyone's faction, but if they say too much, they're a goner!
 </p>


   <h2 className="mobile-center-heading" style={{ color: '#f0b429', fontSize: '1.3rem', textAlign: 'left', marginBottom: '8px', marginTop: '24px' }}>
            Membership Tiers
          </h2>

<section id="hub-tiers" style={{ backgroundColor: '#0a0a0f', marginBottom: '8px' }}>            
  <div className="tier-grid">
              <div
                className="tier-card"
                onClick={() => router.push('/account?tier=stowaway')}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '1.2rem', color: '#a0a0b0', marginBottom: '8px' }}>Stowaway</h3>
            <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rat size={14} strokeWidth={2} /> Join Public Games </li>
  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rat size={14} strokeWidth={2} /> Join Private Games</li>
  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rat size={14} strokeWidth={2} /> Public Text Chat</li>
  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rat size={14} strokeWidth={2} /> Private Voice Chat</li>
  <div style={{ fontSize: '1.5rem', color: '#a0a0b0', textAlign: 'center', fontWeight: 'bold', marginBottom: '0px' }}>
    $0.00
  </div>
</ul>
              </div>

              <div
                className="tier-card"
                onClick={() => router.push('/account?tier=castaway')}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1.75px solid #ffffff',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '8px' }}>Castaway</h3>
                <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Anchor size={14} strokeWidth={2} color="#ffffff" /> All Previous Perks</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Anchor size={14} strokeWidth={2} color="#ffffff" /> Public Voice Chat </li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Anchor size={14} strokeWidth={2} color="#ffffff" /> 5 Sample Hosts </li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Anchor size={14} strokeWidth={2} color="#ffffff" /> Win/Loss Statistics </li>
                  <div style={{ fontSize: '1.5rem', color: '#ffffff', textAlign: 'center', fontWeight: 'bold', marginBottom: '0px' }}>
                    $1.99
                  </div>
                </ul>
              </div>

              <div
                className="tier-card"
                onClick={() => router.push('/account?tier=crewchief')}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1.75px solid rgb(245, 255, 156)',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '1.2rem', color: 'rgb(245, 255, 156)', marginBottom: '8px' }}>Crew Chief</h3>
                <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Drill size={14} strokeWidth={2} color="rgb(245, 255, 156)" /> All Previous Perks</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Drill size={14} strokeWidth={2} color="rgb(245, 255, 156)" /> Host Public Games</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Drill size={14} strokeWidth={2} color="rgb(245, 255, 156)" /> Host Private Games</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Drill size={14} strokeWidth={2} color="rgb(245, 255, 156)" /> Customized Avatar *</li>
                  <div style={{ fontSize: '1.5rem', color: 'rgb(245, 255, 156)', fontWeight: 'bold', textAlign: 'center', marginBottom: '0px' }}>
                    $3.99
                  </div>
                </ul>
              </div>

              <div
                className="tier-card"
                onClick={() => router.push('/account?tier=teamprincipal')}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1.75px solid #e7ab1f',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <h3 style={{ fontSize: '1.2rem', color: '#f0b429', marginBottom: '10px' }}>
                  Team Principal
                </h3>
                <ul style={{ color: '#a0a0b0', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.7', listStyle: 'none', padding: 0 }}>
                 <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rocket size={14} strokeWidth={2} color="#f0b429" /> All Previous Perks</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rocket size={14} strokeWidth={2} color="#f0b429" /> Rename Games *</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rocket size={14} strokeWidth={2} color="#f0b429" /> Highlighted Chats</li>
<li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Rocket size={14} strokeWidth={2} color="#f0b429" /> Build Custom Skin</li>
                  <div style={{ fontSize: '1.5rem', color: '#f0b429', fontWeight: 'bold', textAlign: 'center', marginBottom: '0px' }}>
                    $6.99
                  </div>
                </ul>
              </div>
            </div>
          </section>

              <p style={{ color: '#555570', textAlign: 'center', fontSize: '0.9rem', marginBottom: '12px' }}>
* Asterisk denotes features that have yet to be built out.
 </p>



        <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '4px' }}>Host a Game</h2>
<p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '36px' }}>
Private games are restricted to anyone with whom hosts share the code. Public leagues are playable by anyone who wanders into your lobby. Choose your skin and wreak some havoc!</p>


{isMobile === null ? null : isMobile ? (
  <div style={{
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'left',
    marginBottom: '24px'
  }}>
    <p style={{ color: '#ff6b6b', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
      We currently have {openGames.length} joinable game{openGames.length === 1 ? '' : 's'} in the lobby, but they are, unfortunately, not yet configured to mobile. Hop onto a desktop computer to get in on the action!
    </p>
  </div>
) : (
  <>
 {!showHostPicker ? (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
    <button
      onClick={handleShowHostPicker}
      style={{
        backgroundColor: '#f0b429',
        color: '#0a0a0f',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: 'pointer'
      }}
    >
      Create Game
    </button>
    <span style={{ color: '#555570', fontSize: '1rem' }}>— OR —</span>
    <button
      onClick={() => {
        document.getElementById('public-games')?.scrollIntoView({ behavior: 'smooth' })
      }}
      style={{
        backgroundColor: '#f0b429',
        color: '#0a0a0f',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: 'pointer'
      }}
    >
      Join Game
    </button>
  </div>
) : (
  <div
    onClick={() => setActiveSkinTab(null)}
    style={{ marginBottom: '16px' }}
  >
    {freeRemaining !== null && freeRemaining > 0 && (
      <p style={{ color: '#555570', fontSize: '0.85rem', marginBottom: '16px' }}>
      As a Castaway, you have {freeRemaining} free hosting session{freeRemaining === 1 ? '' : 's'} remaining.
      </p>
    )}

<div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {selectableSkins.map((skin) => {
        const theme = themeContentBySkin[skin]
        return (
          <button
  key={skin}
  onClick={(e) => {
    e.stopPropagation()
    setActiveSkinTab(skin)
  }}
  style={{
    backgroundColor: activeSkinTab === skin ? '#f0b429' : 'transparent',
    color: activeSkinTab === skin ? '#0a0a0f' : '#a0a0b0',
    border: '1px solid #f0b429',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    minWidth: '110px',
    textAlign: 'center',
  }}
>
  {theme.emoji} {theme.displayName}
</button>
        )
      })}
    </div>

    {activeSkinTab && (() => {
      const skin = activeSkinTab
      const theme = themeContentBySkin[skin]
      return (
  <div
  onClick={(e) => e.stopPropagation()}
  style={{
    backgroundColor: '#1a1a2e',
    border: '2px solid #f0b429',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '480px',
    margin: '0 auto',
    textAlign: 'left'
  }}
>
          <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '10px' }}>
            {theme.emoji} {theme.displayName}
          </h2>
          <p style={{ color: '#a0a0b0', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '18px' }}>
            {theme.intro}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
        <button
  onClick={() => setPendingCreate({ skin, isPrivate: false })}
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
  onClick={() => setPendingCreate({ skin, isPrivate: true })}
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
    })()}
  </div>
)}

        <hr style={{ border: 'none', borderTop: '2px solid #2a2a3e', margin: '32px 0' }} />


        {error && <p style={{ color: '#ff6b6b', marginBottom: '24px' }}>{error}</p>}

        {(() => {
          const myGames = openGames.filter((g) => myGameIds.has(g.id))
          const publicGames = openGames.filter((g) => !g.is_private && !myGameIds.has(g.id))
          const privateGames = openGames.filter((g) => g.is_private && !myGameIds.has(g.id))

          const renderGameRow = (g: OpenGame) => {
            const theme = themeContentBySkin[g.skin]
            const isMine = myGameIds.has(g.id)
            const isMyHost = user?.id === g.host_user_id

            return (
              <div key={g.id} style={{
                backgroundColor: '#1a1a2e',
                border: isMine ? '1px solid #f0b429' : '1px solid #2a2a3e',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
  {g.display_name}
  {isMyHost && (
    <span style={{
      color: '#f0b429', fontSize: '0.7rem', fontWeight: 'bold',
      border: '1px solid #f0b429', borderRadius: '4px', padding: '1px 6px'
    }}>
      HOSTING
    </span>
  )}
  {!g.counts_toward_records && (
    <span style={{
      color: '#a0a0b0', fontSize: '0.7rem', fontWeight: 'bold',
      border: '1px solid #555570', borderRadius: '4px', padding: '1px 6px'
    }}>
      CASUAL
    </span>
  )}
</div>
                    <div style={{ color: '#a0a0b0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
  <span>{g.player_count}/10 players</span>
  {g.status !== 'lobby' && !isMine && (
    <span style={{
      color: '#ff6b6b', fontSize: '0.7rem', fontWeight: 'bold',
      border: '1px solid #ff6b6b', borderRadius: '4px', padding: '1px 6px'
    }}>
      GAME STARTED
    </span>
  )}
</div>
                  </div>
                </div>

                {g.is_private && !isMine ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ display: 'flex', gap: '6px' }}>
      {g.is_private && <span style={{ position: 'relative', top: '7px' }}>🔒</span>}                   
      <input
        type="text"
        placeholder="Join Code"
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
          minWidth: '115px',
          borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem',
          cursor: 'pointer'
        }}
      >
        Join
      </button>
    </div>
    {privateJoinError[g.id] && (
      <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: 0 }}>{privateJoinError[g.id]}</p>
    )}
  </div>
) : (
                  <button
                    onClick={() => handleJoinPublic(g)}
                    disabled={joiningId === g.id || (!isMine && g.status === 'lobby' && g.player_count >= 10)}
                    style={{
                      backgroundColor: '#f0b429', color: '#0a0a0f', padding: '8px 20px',
                      borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem',
                      minWidth: '115px',
                      cursor: (!isMine && g.status === 'lobby' && g.player_count >= 10) ? 'not-allowed' : 'pointer',
                      opacity: (!isMine && g.status === 'lobby' && g.player_count >= 10) ? 0.5 : 1
                    }}
                  >
                    {isMine
                      ? 'Return'
                      : g.status === 'lobby'
                      ? (g.player_count >= 10 ? 'Full' : 'Join')
                      : 'Spectate'}
                  </button>
                )}
              </div>
            )
          }

          return (
            <>
              {myGames.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '10px' }}>My Current Games</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {myGames.map(renderGameRow)}
                  </div>
                </div>
              )}

          <div id="public-games" style={{ marginBottom: '24px' }}>
  <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '4px' }}>Public Games</h2>
                {publicGames.length === 0 ? (
                  <p style={{ color: '#555570' }}>No public games running right now; be the first to host one!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {publicGames.map(renderGameRow)}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '4px' }}>Private Games</h2>
                {privateGames.length === 0 ? (
                  <p style={{ color: '#555570' }}>No private games running right now; be the first to host one!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {privateGames.map(renderGameRow)}
                  </div>
                )}
              </div>
            </>
          )
        })()}

{pendingCreate && (
  <div
    onClick={() => setPendingCreate(null)}
    style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: '#1a1a2e', border: '1px solid #f0b429', borderRadius: '12px',
        padding: '24px', maxWidth: '380px', width: '90%', textAlign: 'left'
      }}
    >
      <p style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px', textAlign: 'left' }}>
        Create new {pendingCreate.isPrivate ? 'private' : 'public'} league?
      </p>
      <p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '14px', textAlign: 'left' }}>
        {pendingCreate.isPrivate
          ? 'Players can only join this game with a special code, generated once your league is created.'
          : 'Any player will be able to join this league from our main lobby. Happy deceiving!'}
      </p>
     {freeRemaining !== null && freeRemaining > 0 && (
  <p style={{ color: '#555570', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
          After this, you will have {Math.max(0, freeRemaining - 1)} free host{Math.max(0, freeRemaining - 1) === 1 ? '' : 's'} remaining unless you upgrade to Crew Chief+.
        </p>
      )}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={() => {
            const { skin, isPrivate } = pendingCreate
            setPendingCreate(null)
            handleCreate(skin, isPrivate)
          }}
          disabled={creating}
          style={{
            backgroundColor: '#f0b429', color: '#0a0a0f', padding: '10px 24px',
            borderRadius: '6px', border: 'none', fontWeight: 'bold',
            cursor: creating ? 'not-allowed' : 'pointer'
          }}
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
        <button
          onClick={() => setPendingCreate(null)}
          style={{
            backgroundColor: 'transparent', color: '#a0a0b0', padding: '10px 24px',
            borderRadius: '6px', border: '1px solid #2a2a3e', cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
</>
)}
</div>
    </main>
  )
}