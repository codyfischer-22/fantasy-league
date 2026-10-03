'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import GameLobby from '@/components/social-game/GameLobby'
import RoleReveal from '@/components/social-game/RoleReveal'
import SeatCircle from '@/components/social-game/SeatCircle'
import MissionProposal from '@/components/social-game/MissionProposal'
import WaitingForProposal from '@/components/social-game/WaitingForProposal'
import TeamVote from '@/components/social-game/TeamVote'
import MissionCards from '@/components/social-game/MissionCards'
import MissionResultModal from '@/components/social-game/MissionResultModal'
import CaptainGuess from '@/components/social-game/CaptainGuess'
import GameOver from '@/components/social-game/GameOver'
import { themeContentBySkin } from '@/lib/social-game/themeContent'
import { roleTermsBySkin } from '@/lib/social-game/roles'

type Game = {
  id: number
  skin: string
  status: string
  host_user_id: string
  join_code: string | null
  is_private: boolean
  display_name: string
}

type SeatPlayer = {
  user_id: string
  seat_order: number
  display_name: string
  role: string
}

type ActiveMission = {
  id: number
  leader_user_id: string
  proposed_team: string[]
  vote_result: string | null
  mission_result: string | null
}


export default function SocialGameRoomPage() {
  const params = useParams()
  const gameId = Number(params.gameId)
  const { user, loading: authLoading } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [isSeated, setIsSeated] = useState(false)
  const [players, setPlayers] = useState<SeatPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [showRole, setShowRole] = useState(false)
  const [currentLeaderSeat, setCurrentLeaderSeat] = useState<number | null>(null)
  const [currentMission, setCurrentMission] = useState<number>(1)
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null)
  const [myRole, setMyRole] = useState<string>('')
  const [seenResultFor, setSeenResultFor] = useState<number | null>(null)
const [introStep, setIntroStep] = useState<number | null>(null)

  async function loadGame() {
const { data } = await supabase
  .from('social_games')
  .select('id, skin, status, host_user_id, current_leader_seat, current_mission, join_code, is_private, display_name')
  .eq('id', gameId)
  .single()
    setGame(data)
    if (data) {
      setCurrentLeaderSeat(data.current_leader_seat)
      setCurrentMission(data.current_mission)
    }

    if (data && user) {
      const { data: seatRow } = await supabase
        .from('social_game_players')
        .select('id, role')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle()
      setIsSeated(!!seatRow)
      setMyRole(seatRow?.role ?? '')
    }

    if (data && data.status !== 'lobby') {
    const { data: seatRows } = await supabase
  .from('social_game_players')
  .select('user_id, seat_order, role')
  .eq('game_id', gameId)
  .order('seat_order')

      if (seatRows) {
        const userIds = seatRows.map((r) => r.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds)
        const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name || 'Player']))
   setPlayers(
  seatRows.map((r) => ({
    user_id: r.user_id,
    seat_order: r.seat_order,
    display_name: nameMap.get(r.user_id) ?? 'Player',
    role: r.role,
  }))
)
      }

      const { data: missionRow } = await supabase
        .from('social_game_missions')
        .select('id, leader_user_id, proposed_team, vote_result, mission_result')
        .eq('game_id', gameId)
        .eq('mission_number', data.current_mission)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()
      setActiveMission(missionRow)
    }

    setLoading(false)
  }

useEffect(() => {
  if (!game) return
  const key = `social-game-intro-seen-${game.id}`
  const alreadySeen = localStorage.getItem(key)
  if (!alreadySeen) {
    setIntroStep(0)
  }
}, [game?.id])

useEffect(() => {
  if (!game) return
  setIntroStep(0) // TEMP: always show while editing — remove this line and restore the check below when done
  // const key = `social-game-intro-seen-${game.id}`
  // const alreadySeen = localStorage.getItem(key)
  // if (!alreadySeen) {
  //   setIntroStep(0)
  // }
}, [game?.id])

  useEffect(() => {
    if (authLoading) return
    loadGame()
    const interval = setInterval(loadGame, 2000)
    return () => clearInterval(interval)
  }, [gameId, user, authLoading])

  if (authLoading || loading) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  if (!game) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Game not found.
      </main>
    )
  }


const theme = themeContentBySkin[game.skin]

const roleTerms = roleTermsBySkin[game.skin]

const roleDescriptionMap: Record<string, { name: string; description: string }> = {
  goodTeamMember: { name: roleTerms.goodTeamMember, description: roleTerms.goodTeamMemberDescription },
  goodCaptain: { name: roleTerms.goodCaptain, description: roleTerms.goodCaptainDescription },
  badTeamMember: { name: roleTerms.badTeamMember, description: roleTerms.badTeamMemberDescription },
  badCaptain: { name: roleTerms.badCaptain, description: roleTerms.badCaptainDescription },
}

const rawRoleInfo = roleDescriptionMap[myRole]
const myRoleInfo = rawRoleInfo
  ? {
      name: rawRoleInfo.name,
      description: rawRoleInfo.description
        .replace(/\{mission\}/g, roleTerms.mission.toLowerCase())
        .replace(/\{missionLeader\}/g, roleTerms.missionLeader)
        .replace(/\{passMission\}/g, roleTerms.passMission)
        .replace(/\{failMission\}/g, roleTerms.failMission),
    }
  : undefined

const introSteps = [
  {
    heading: `${theme.emoji} Welcome to the ${theme.displayName}!`,
    roleName: '',
    body: theme.intro,
  },
  {
  heading: 'Your Role:',
  roleName: myRoleInfo.name,
  body: myRoleInfo.description,
},
  {
  heading: 'Others\u0027 Roles',
  roleName: '',
body: `Click "View Role" in your seat to see what information your character has to start the game.\n\n${roleTerms.goodTeamMember}s can only see their role, ${roleTerms.badTeamMember}s can see their teammates, and the ${roleTerms.goodCaptain} can see everyone at the ${roleTerms.placeSetting}.`},
 {
  heading: 'Proposal Tutorial',
  roleName: '',
  body: `All 5 rounds of gameplay will have a ${roleTerms.missionLeader} (highlighted) propose a group of 2-5.\n\nAll players publicly vote on whether or not they want the proposed group to participate in the ${roleTerms.mission}.\n\nIf a majority approves, those players cast private votes on their intended ${roleTerms.mission} outcome.\n\nIf a majority does not approve, the ${roleTerms.missionLeader} passes clockwise for another proposal.\n\nIf 5 proposals in a row are rejected, the ${roleTerms.badTeamMember}s automatically win.`,
},
]

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
  {game.status === 'lobby' ? (
  <GameLobby
  gameId={game.id}
  skin={game.skin}
  hostUserId={game.host_user_id}
  joinCode={game.join_code}
  isPrivate={game.is_private}
  displayName={game.display_name}
  onGameStarted={() => loadGame()}
/>
) : game.status === 'good_wins' || game.status === 'evil_wins' ? (
  <GameOver skin={game.skin} status={game.status} players={players} />
) : game.status === 'captain_guess' ? (
  isSeated ? (
    <CaptainGuess
      gameId={game.id}
      skin={game.skin}
      players={players}
      myUserId={user!.id}
      myRole={myRole}
      onGuessed={() => loadGame()}
    />
  ) : (
    <p style={{ color: '#a0a0b0' }}>👀 Final guess in progress...</p>
  )
) : (

  <div style={{ textAlign: 'center' }}>
   
   <h2 style={{ color: '#ffffff', fontSize: '1.4rem', marginBottom: '24px' }}>
  {theme.emoji} <span style={{ color: '#f0b429' }}>{game.display_name}</span> Game Room
</h2>

        <SeatCircle
  players={players}
  hostUserId={game.host_user_id}
  myUserId={isSeated ? user?.id : undefined}
  onMySeatClick={() => setShowRole(true)}
  circleSize={players.length >= 8 ? 460 : players.length >= 6 ? 420 : 380}
  seatSize={players.length >= 9 ? 80 : players.length >= 7 ? 90 : players.length >= 6 ? 100 : 110}
  currentLeaderUserId={players.find((p) => p.seat_order === currentLeaderSeat)?.user_id}
/>
          {isSeated ? (
            (() => {
              const leaderSeat = players.find((p) => p.seat_order === currentLeaderSeat)
              const isMeLeader = leaderSeat?.user_id === user?.id

              if (activeMission) {
                if (activeMission.vote_result === 'approved' && !activeMission.mission_result) {
                  return (
                    <MissionCards
                      missionId={activeMission.id}
                      skin={game.skin}
                      myUserId={user!.id}
                      myRole={myRole}
                      isOnTeam={activeMission.proposed_team.includes(user!.id)}
                      onResolved={() => loadGame()}
                    />
                  )
                }
                if (!activeMission.vote_result) {
                  return (
                    <TeamVote
                      missionId={activeMission.id}
                      skin={game.skin}
                      players={players}
                      proposedTeam={activeMission.proposed_team}
                      leaderName={leaderSeat?.display_name ?? 'the leader'}
                      myUserId={user!.id}
                      onResolved={() => loadGame()}
                    />
                  )
                }
                return <p style={{ color: '#a0a0b0' }}>Resolving...</p>
              }

              if (isMeLeader) {
                return (
                  <MissionProposal
                    gameId={game.id}
                    skin={game.skin}
                    players={players}
                    currentMission={currentMission}
                    onProposed={() => loadGame()}
                  />
                )
              }

              return (
                <WaitingForProposal
                  leaderName={leaderSeat?.display_name ?? 'the leader'}
                  missionLabel={`Mission ${currentMission}`}
                />
              )
            })()
          ) : (
            <p style={{ color: '#a0a0b0' }}>
              👀 You&apos;re spectating this game. The spectator view isn&apos;t built yet, but you&apos;re in the room!
            </p>
          )}
        </div>
      )}

{activeMission && (activeMission.vote_result === 'rejected' || activeMission.mission_result) && seenResultFor !== activeMission.id && (
  <MissionResultModal
    missionId={activeMission.id}
    missionNumber={currentMission}
    skin={game.skin}
    voteResult={activeMission.vote_result}
    missionResult={activeMission.mission_result}
    onClose={() => {
      setSeenResultFor(activeMission.id)
      supabase.rpc('acknowledge_mission_result', { p_game_id: game.id, p_mission_number: currentMission })
        .then(() => loadGame())
    }}
  />
)}

{introStep !== null && introSteps[introStep] && (
  <div
    style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
      padding: '20px'
    }}
  >
    <div
      style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '28px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center'
      }}
    >
     <h3 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '12px', textAlign: 'left' }}>
  {introSteps[introStep].heading}{' '}
  {introSteps[introStep].roleName && (
    <span style={{ color: '#ffffff' }}>{introSteps[introStep].roleName}</span>
  )}
</h3>
      {introSteps[introStep].body.split('\n\n').map((paragraph, i) => (
  <p
    key={i}
    style={{
      color: '#a0a0b0',
      fontSize: '0.9rem',
      lineHeight: '1.6',
      marginBottom: '8px',
      textAlign: 'left'
    }}
  >
    {paragraph}
  </p>
))}
   <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
  {introSteps.map((_, i) => (
    <button
      key={i}
      onClick={() => setIntroStep(i)}
      style={{
        width: '7px',
        height: '7px',
        padding: 0,
        border: 'none',
        borderRadius: '50%',
        backgroundColor: i === introStep ? '#f0b429' : '#2a2a3e',
        cursor: 'pointer'
      }}
    />
  ))}
</div>
      <button
        onClick={() => {
          if (introStep < introSteps.length - 1) {
            setIntroStep(introStep + 1)
          } else {
            setIntroStep(null)
            localStorage.setItem(`social-game-intro-seen-${game.id}`, 'true')
          }
        }}
        style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '10px 28px',
          borderRadius: '8px',
          border: 'none',
          marginRight: '12px',
          fontWeight: 'bold',
          minWidth: '95px',
          fontSize: '0.9rem',
          cursor: 'pointer'
        }}
      >
        {introStep < introSteps.length - 1 ? 'Next' : "Let's Play!"}
      </button>
      {introStep < introSteps.length - 1 && (
    <button
      onClick={() => {
        setIntroStep(null)
        localStorage.setItem(`social-game-intro-seen-${game.id}`, 'true')
      }}
      style={{
        backgroundColor: 'transparent',
        color: '#a0a0b0',
        border: '1px solid #2a2a3e',
        padding: '10px 24px',
        borderRadius: '8px',
        fontWeight: 'bold',
        minWidth: '95px',
        fontSize: '0.9rem',
        cursor: 'pointer'
      }}
    >
      Skip
    </button>
)}
    </div>
  </div>
)}

      {showRole && user && (
        <RoleReveal gameId={game.id} skin={game.skin} myUserId={user.id} onClose={() => setShowRole(false)} />
      )}
    </main>
  )
}