'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

type Castaway = {
  id: number
  name: string
}
type PlayerResult = {
  user_id: string
  display_name: string
}

type Trade = {
  id: string
  proposing_user_id: string
  receiving_user_id: string
  offered_castaway_id: number
  requested_castaway_id: number
  status: string
  declined_by: string | null
  created_at: string
  resolved_at: string | null
}

export default function TradePortalPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const { user } = useAuth()

  const [leagueId, setLeagueId] = useState<number | null>(null)
  const [leagueName, setLeagueName] = useState<string | null>(null)
  const [myCastaways, setMyCastaways] = useState<Castaway[]>([])
  const [selectedOfferedId, setSelectedOfferedId] = useState<number | null>(null)
  const [playerSearch, setPlayerSearch] = useState('')
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([])
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState<PlayerResult | null>(null)
  const [theirCastaways, setTheirCastaways] = useState<Castaway[]>([])
  const [selectedRequestedId, setSelectedRequestedId] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const [myOffers, setMyOffers] = useState<Trade[]>([])
  const [receivedOffers, setReceivedOffers] = useState<Trade[]>([])
  const [pendingApproval, setPendingApproval] = useState<Trade[]>([])
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])
  const [castawayNames, setCastawayNames] = useState<Record<number, string>>({})
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({})
  const [isHost, setIsHost] = useState(false)
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const [requireHostApproval, setRequireHostApproval] = useState(false)
  const [isPrivateLeague, setIsPrivateLeague] = useState(false)
  const [historyLimit, setHistoryLimit] = useState(10)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const selectStyle = {
  width: '100%',
  padding: '10px',
  paddingRight: '28px',
  marginBottom: '16px',
  borderRadius: '6px',
  border: '1px solid #2a2a3e',
  backgroundColor: '#12121a',
  color: '#ffffff',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f0b429' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  backgroundSize: '16px',
}

  // Load league info
  useEffect(() => {
    async function loadLeague() {
      const { data } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()
      setLeagueId(data?.id ?? null)
      setLeagueName(data?.name ?? null)
    }
    loadLeague()
  }, [type, instance])

  // Load all trade sections
  useEffect(() => {
    async function loadTrades() {
      if (!user || !leagueId) return

      const { data: leagueData } = await supabase
        .from('leagues')
        .select('host_user_id, require_host_trade_approval, is_private')
        .eq('id', leagueId)
        .single()

      setIsHost(leagueData?.host_user_id === user.id)
      setRequireHostApproval(leagueData?.require_host_trade_approval ?? false)
      setIsPrivateLeague(leagueData?.is_private ?? false)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_global_admin')
        .eq('user_id', user.id)
        .single()
      setIsGlobalAdmin(profileData?.is_global_admin ?? false)

      const { data: madeData } = await supabase
        .from('trades')
        .select('*')
        .eq('league_id', leagueId)
        .eq('proposing_user_id', user.id)
        .in('status', ['pending', 'pending_host_approval'])
        .order('created_at', { ascending: false })
      setMyOffers(madeData ?? [])

    const { data: receivedData } = await supabase
  .from('trades')
  .select('*')
  .eq('league_id', leagueId)
  .eq('receiving_user_id', user.id)
  .in('status', ['pending', 'pending_host_approval'])
  .order('created_at', { ascending: false })
      setReceivedOffers(receivedData ?? [])

const canApprove = leagueData?.host_user_id === user.id || profileData?.is_global_admin
let approvalData: Trade[] = []
if (canApprove) {
  const { data } = await supabase
    .from('trades')
    .select('*')
    .eq('league_id', leagueId)
    .eq('status', 'pending_host_approval')
    .order('created_at', { ascending: false })
  approvalData = data ?? []
  setPendingApproval(approvalData)
}
      const { data: historyData } = await supabase
        .from('trades')
        .select('*')
        .eq('league_id', leagueId)
        .in('status', ['accepted', 'declined', 'withdrawn'])
        .order('resolved_at', { ascending: false })
        .limit(historyLimit)
      setTradeHistory(historyData ?? [])

     const allTrades = [
  ...(madeData ?? []),
  ...(receivedData ?? []),
  ...(historyData ?? []),
  ...(approvalData ?? []),
]


      const castawayIds = [...new Set(allTrades.flatMap((t) => [t.offered_castaway_id, t.requested_castaway_id]))]
      const userIds = [...new Set(allTrades.flatMap((t) => [t.proposing_user_id, t.receiving_user_id]))]

      if (castawayIds.length > 0) {
        const { data: castawayRows } = await supabase
          .from('castaways')
          .select('id, name')
          .in('id', castawayIds)
        const nameMap: Record<number, string> = {}
        ;(castawayRows ?? []).forEach((c) => { nameMap[c.id] = c.name })
        setCastawayNames((prev) => ({ ...prev, ...nameMap }))
      }

      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds)
        const nameMap: Record<string, string> = {}
        ;(profileRows ?? []).forEach((p) => { nameMap[p.user_id] = p.display_name })
        setDisplayNames((prev) => ({ ...prev, ...nameMap }))
      }
    }
    loadTrades()
  }, [user, leagueId, reloadTrigger, historyLimit])

  // Load my own castaways
  useEffect(() => {
  async function loadMyCastaways() {
    if (!user || !leagueId) return
    const { data: pickRows, error: pickError } = await supabase
      .from('draft_picks')
      .select('castaway_id')
      .eq('league_id', leagueId)
      .eq('user_id', user.id)
    if (pickError) {
      console.error('Error loading my picks:', JSON.stringify(pickError, null, 2))
      return
    }
    const castawayIds = (pickRows ?? []).map((row) => row.castaway_id)
    if (castawayIds.length === 0) {
      setMyCastaways([])
      return
    }
    const { data: castawayRows, error: castawayError } = await supabase
      .from('castaways')
      .select('id, name, status')
      .in('id', castawayIds)
      .eq('status', 'active')
    if (castawayError) {
      console.error('Error loading my castaways:', JSON.stringify(castawayError, null, 2))
      return
    }
    setMyCastaways(castawayRows ?? [])
  }
  loadMyCastaways()
}, [user, leagueId])

  // Search for other players
  useEffect(() => {
    async function searchPlayers() {
      if (!leagueId || playerSearch.trim().length === 0) {
        setPlayerResults([])
        return
      }
      const { data: memberRows, error: memberError } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', leagueId)
      if (memberError) {
        console.error('Error loading league members:', JSON.stringify(memberError, null, 2))
        return
      }
      const memberIds = (memberRows ?? []).map((m) => m.user_id).filter((id) => id !== user?.id)
      if (memberIds.length === 0) {
        setPlayerResults([])
        return
      }
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', memberIds)
        .ilike('display_name', `%${playerSearch}%`)
      if (profileError) {
        console.error('Error searching players:', JSON.stringify(profileError, null, 2))
        return
      }
      setPlayerResults(profileRows ?? [])
    }
    searchPlayers()
  }, [playerSearch, leagueId, user])

  // Load target player's castaways
 useEffect(() => {
  async function loadTheirCastaways() {
    if (!leagueId || !selectedTargetPlayer) {
      setTheirCastaways([])
      return
    }
    const { data: pickRows, error: pickError } = await supabase
      .from('draft_picks')
      .select('castaway_id')
      .eq('league_id', leagueId)
      .eq('user_id', selectedTargetPlayer.user_id)
    if (pickError) {
      console.error('Error loading their picks:', JSON.stringify(pickError, null, 2))
      return
    }
    const castawayIds = (pickRows ?? []).map((row) => row.castaway_id)
    if (castawayIds.length === 0) {
      setTheirCastaways([])
      return
    }
    const { data: castawayRows, error: castawayError } = await supabase
      .from('castaways')
      .select('id, name, status')
      .in('id', castawayIds)
      .eq('status', 'active')
    if (castawayError) {
      console.error('Error loading their castaways:', JSON.stringify(castawayError, null, 2))
      return
    }
    setTheirCastaways(castawayRows ?? [])
  }
  loadTheirCastaways()
}, [leagueId, selectedTargetPlayer])

  async function handleConfirmPropose() {
    if (!user || !leagueId || !selectedTargetPlayer || !selectedOfferedId || !selectedRequestedId) return
    setSubmitting(true)
    setMessage('')

    const { data: statusCheck } = await supabase
  .from('castaways')
  .select('id, status')
  .in('id', [selectedOfferedId, selectedRequestedId])

const hasEliminated = (statusCheck ?? []).some((c) => c.status === 'eliminated')
if (hasEliminated) {
  setMessage('One of these castaways has been voted out and can no longer be traded.')
  setSubmitting(false)
  return
}

    const { data: activeTrades, error: checkError } = await supabase
      .from('trades')
      .select('id, offered_castaway_id, requested_castaway_id, proposing_user_id, receiving_user_id')
      .eq('league_id', leagueId)
      .in('status', ['pending', 'pending_host_approval'])

    if (checkError) {
      console.error('Error checking active trades:', JSON.stringify(checkError, null, 2))
      setSubmitting(false)
      return
    }

  const conflict = (activeTrades ?? []).some(
  (t) =>
    (t.offered_castaway_id === selectedOfferedId && t.proposing_user_id === user.id) ||
    (t.requested_castaway_id === selectedOfferedId && t.receiving_user_id === user.id) ||
    (t.offered_castaway_id === selectedRequestedId && t.proposing_user_id === selectedTargetPlayer.user_id) ||
    (t.requested_castaway_id === selectedRequestedId && t.receiving_user_id === selectedTargetPlayer.user_id)
)

    if (conflict) {
      setMessage('One of these castaways is already part of an active trade.')
      setSubmitting(false)
      return
    }

    // Check the receiving player doesn't already own the requested castaway
// and the proposing player doesn't already own the offered castaway back
const { data: theirExistingPicks } = await supabase
  .from('draft_picks')
  .select('castaway_id')
  .eq('league_id', leagueId)
  .eq('user_id', selectedTargetPlayer.user_id)

const theyAlreadyOwnOffered = (theirExistingPicks ?? []).some(
  (p) => p.castaway_id === selectedOfferedId
)

if (theyAlreadyOwnOffered) {
  setMessage(`${selectedTargetPlayer.display_name} already owns ${myOfferedCastawayName}.`)
  setSubmitting(false)
  return
}

const { data: myExistingPicks } = await supabase
  .from('draft_picks')
  .select('castaway_id')
  .eq('league_id', leagueId)
  .eq('user_id', user.id)

const iAlreadyOwnRequested = (myExistingPicks ?? []).some(
  (p) => p.castaway_id === selectedRequestedId
)

if (iAlreadyOwnRequested) {
  setMessage(`You already own ${theirRequestedCastawayName}.`)
  setSubmitting(false)
  return
}

    const { error } = await supabase.from('trades').insert({
      league_id: leagueId,
      proposing_user_id: user.id,
      receiving_user_id: selectedTargetPlayer.user_id,
      offered_castaway_id: selectedOfferedId,
      requested_castaway_id: selectedRequestedId,
      status: 'pending',
    })

    setSubmitting(false)

    if (error) {
      console.error('Error proposing trade:', JSON.stringify(error, null, 2))
      setMessage('Something went wrong. Please try again.')
      return
    }

    await supabase.from('notifications').insert({
      user_id: selectedTargetPlayer.user_id,
      message: `You've received a trade offer in ${leagueName}!`,
      link: `/leagues/${type}/${instance}/trade-portal`,
    })

    setMessage('Trade offer sent!')
    setShowConfirm(false)
    setSelectedOfferedId(null)
    setSelectedTargetPlayer(null)
    setSelectedRequestedId(null)
    setPlayerSearch('')
    setReloadTrigger((prev) => prev + 1)
  }

  async function handleWithdraw(tradeId: string) {
    const { error } = await supabase
      .from('trades')
      .update({ status: 'withdrawn', resolved_at: new Date().toISOString() })
      .eq('id', tradeId)
    if (error) {
      console.error('Error withdrawing trade:', JSON.stringify(error, null, 2))
      return
    }
    setReloadTrigger((prev) => prev + 1)
  }

    async function executeTrade(trade: Trade) {
    const { data: receiverPicks } = await supabase
      .from('draft_picks')
      .select('castaway_id')
      .eq('league_id', leagueId)
      .eq('user_id', trade.receiving_user_id)
    const receiverAlreadyOwnsOffered = (receiverPicks ?? []).some(
      (p) => p.castaway_id === trade.offered_castaway_id
    )
    const { data: proposerPicks } = await supabase
      .from('draft_picks')
      .select('castaway_id')
      .eq('league_id', leagueId)
      .eq('user_id', trade.proposing_user_id)
    const proposerAlreadyOwnsRequested = (proposerPicks ?? []).some(
      (p) => p.castaway_id === trade.requested_castaway_id
    )

const { data: statusCheck } = await supabase
  .from('castaways')
  .select('id, status')
  .in('id', [trade.offered_castaway_id, trade.requested_castaway_id])

const hasEliminated = (statusCheck ?? []).some((c) => c.status === 'eliminated')
if (hasEliminated) {
  console.error('Trade blocked: involves an eliminated castaway')
  await supabase
    .from('trades')
    .update({ status: 'declined', declined_by: 'system', resolved_at: new Date().toISOString() })
    .eq('id', trade.id)
  return
}

    if (receiverAlreadyOwnsOffered || proposerAlreadyOwnsRequested) {
      console.error('Trade would result in duplicate ownership.')
      await supabase
        .from('trades')
        .update({ status: 'declined', declined_by: 'system', resolved_at: new Date().toISOString() })
        .eq('id', trade.id)
      return
    }
    const { error: statusError } = await supabase
      .from('trades')
      .update({ status: 'accepted', resolved_at: new Date().toISOString() })
      .eq('id', trade.id)
    if (statusError) {
      console.error('Error updating trade status:', JSON.stringify(statusError, null, 2))
      return
    }
    const { error: error1 } = await supabase
      .from('draft_picks')
      .update({ user_id: trade.receiving_user_id })
      .eq('league_id', leagueId)
      .eq('castaway_id', trade.offered_castaway_id)
      .eq('user_id', trade.proposing_user_id)
    const { error: error2 } = await supabase
      .from('draft_picks')
      .update({ user_id: trade.proposing_user_id })
      .eq('league_id', leagueId)
      .eq('castaway_id', trade.requested_castaway_id)
      .eq('user_id', trade.receiving_user_id)
    if (error1 || error2) {
      console.error('Error executing trade swap:', JSON.stringify(error1 || error2, null, 2))
      return
    }
    await supabase.from('notifications').insert([
      {
        user_id: trade.proposing_user_id,
        message: `Your trade offer in ${leagueName} was accepted!`,
        link: `/leagues/${type}/${instance}/trade-portal`,
      },
      {
        user_id: trade.receiving_user_id,
        message: `Your trade offer in ${leagueName} was accepted!`,
        link: `/leagues/${type}/${instance}/trade-portal`,
      },
    ])
  }

  async function handleAccept(trade: Trade) {
    if (requireHostApproval) {
      const { error } = await supabase
        .from('trades')
        .update({ status: 'pending_host_approval' })
        .eq('id', trade.id)
      if (error) {
        console.error('Error accepting trade:', JSON.stringify(error, null, 2))
        return
      }

      let approverIds: string[] = []
      if (isPrivateLeague) {
        const { data: leagueData } = await supabase
          .from('leagues')
          .select('host_user_id')
          .eq('id', leagueId)
          .single()
        if (leagueData?.host_user_id) approverIds = [leagueData.host_user_id]
      } else {
        const { data: admins } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('is_global_admin', true)
        approverIds = (admins ?? []).map((a) => a.user_id)
      }

      if (approverIds.length > 0) {
        await supabase.from('notifications').insert(
          approverIds.map((id) => ({
            user_id: id,
            message: `A trade in ${leagueName} is awaiting your approval.`,
            link: `/leagues/${type}/${instance}/trade-portal`,
          }))
        )
      }
    } else {
      await executeTrade(trade)
    }
    setReloadTrigger((prev) => prev + 1)
  }

  async function handleDecline(tradeId: string) {
    const { error } = await supabase
      .from('trades')
.update({ status: 'declined', declined_by: 'player', resolved_at: new Date().toISOString() })      .eq('id', tradeId)
    if (error) {
      console.error('Error declining trade:', JSON.stringify(error, null, 2))
      return
    }
    setReloadTrigger((prev) => prev + 1)
  }

  async function handleApprove(trade: Trade) {
    await executeTrade(trade)
    setReloadTrigger((prev) => prev + 1)
  }

  async function handleDeny(trade: Trade) {
    const { error } = await supabase
      .from('trades')
.update({ status: 'declined', declined_by: 'host', resolved_at: new Date().toISOString() })      .eq('id', trade.id)
    if (error) {
      console.error('Error denying trade:', JSON.stringify(error, null, 2))
      return
    }
    await supabase.from('notifications').insert([
      {
        user_id: trade.proposing_user_id,
        message: `Your trade offer in ${leagueName} was denied by the host.`,
        link: `/leagues/${type}/${instance}/trade-portal`,
      },
      {
        user_id: trade.receiving_user_id,
        message: `A trade you accepted in ${leagueName} was denied by the host.`,
        link: `/leagues/${type}/${instance}/trade-portal`,
      },
    ])
    setReloadTrigger((prev) => prev + 1)
  }

  const myOfferedCastawayName = myCastaways.find((c) => c.id === selectedOfferedId)?.name
  const theirRequestedCastawayName = theirCastaways.find((c) => c.id === selectedRequestedId)?.name

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '60px 40px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingLeft: '20px' }}>
        <a href={`/leagues/${type}/${instance}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to {leagueName || 'League'}
        </a>

        <h1 style={{ fontSize: '2.25rem', marginBottom: '4px' }}>
          <span style={{ color: '#f0b429' }}>🔄 League</span>{' '}
          <span style={{ color: '#ffffff' }}>Trade Portal</span>
        </h1>

      <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '32px' }}>
  Didn&apos;t get your dream team in the draft? There&apos;s still time to secure your favorite players as long as they&apos;re in the game. Full trade policies can be found{' '}
  <a href={`/leagues/${type}/draft`} style={{ color: '#f0b429', textDecoration: 'underline' }}>
    here
  </a>.
</p>

        <div style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '32px'
        }}>
          <h2 style={{ color: '#f0b429', fontSize: '1.3rem', marginBottom: '16px' }}>
            Propose a Trade
          </h2>

          <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}>
            1. Castaway you are offering:
          </label>
         <select
  value={selectedOfferedId ?? ''}
  onChange={(e) => setSelectedOfferedId(Number(e.target.value))}
  style={selectStyle}
>
            <option value="">Select Castaway...</option>
            {myCastaways.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
            2. Tribe you wish to trade with:
          </label>
          {!selectedTargetPlayer ? (
            <>
              <input
                type="text"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Search by Display Name"
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '16px',
                  borderRadius: '6px',
                  border: '1px solid #2a2a3e',
                  backgroundColor: '#12121a',
                  color: '#ffffff'
                }}
              />
              {playerResults.length > 0 && (
                <div style={{
                  backgroundColor: '#12121a',
                  border: '1px solid #2a2a3e',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  {playerResults.map((p) => (
                    <div
                      key={p.user_id}
                      onClick={() => {
                        setSelectedTargetPlayer(p)
                        setPlayerResults([])
                      }}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #2a2a3e'
                      }}
                    >
                      {p.display_name}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              marginBottom: '16px',
              borderRadius: '6px',
              border: '1px solid #2a2a3e',
              backgroundColor: '#12121a'
            }}>
              <span>{selectedTargetPlayer.display_name}</span>
              <button
                onClick={() => {
                  setSelectedTargetPlayer(null)
                  setSelectedRequestedId(null)
                }}
                style={{ background: 'none', border: 'none', color: '#a0a0b0', cursor: 'pointer' }}
              >
                Change
              </button>
            </div>
          )}

          {selectedTargetPlayer && (
            <>
              <label style={{ display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }}>
                Castaway you are requesting:
              </label>
           <select
  value={selectedOfferedId ?? ''}
  onChange={(e) => setSelectedOfferedId(Number(e.target.value))}
  style={selectStyle}
>
                <option value="">Select a Castaway...</option>
                {theirCastaways.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </>
          )}

          <button
            onClick={() => { setMessage(''); setShowConfirm(true) }}            
            disabled={!selectedOfferedId || !selectedTargetPlayer || !selectedRequestedId}
            style={{
              backgroundColor: '#f0b429',
              color: '#0a0a0f',
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 'bold',
              cursor: (!selectedOfferedId || !selectedTargetPlayer || !selectedRequestedId) ? 'not-allowed' : 'pointer',
              opacity: (!selectedOfferedId || !selectedTargetPlayer || !selectedRequestedId) ? 0.5 : 1
            }}
          >
            Offer Trade
          </button>

          {message && (
            <p style={{ color: '#f0b429', marginTop: '12px', fontSize: '0.9rem' }}>{message}</p>
          )}
        </div>

        {showConfirm && (
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
              padding: '24px',
              maxWidth: '420px',
              textAlign: 'left'
            }}>
              <p style={{ color: '#ffffff', marginBottom: '12px', lineHeight: '1.6' }}>
                You are offering {selectedTargetPlayer?.display_name} <strong style={{ color: '#f0b429' }}>{myOfferedCastawayName}</strong> in exchange for{' '}
                <strong style={{ color: '#f0b429' }}>{theirRequestedCastawayName}</strong>.
              </p>
              <p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.6' }}>
                Are you sure you want to make this offer? {myOfferedCastawayName} will sit in the Trade Portal (and be ineligible for other trade offers) until being accepted, denied, or withdrawn.
              </p>
         {message && (
  <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
    <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Trade Failed: </span>
    <span style={{ color: '#a0a0b0', fontWeight: 'normal' }}>{message}</span>
  </p>
)}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={handleConfirmPropose}
                  disabled={submitting}
                  style={{
                    backgroundColor: '#f0b429',
                    color: '#0a0a0f',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Sending...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#a0a0b0',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: '1px solid #2a2a3e',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {myOffers.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '12px' }}>Offers I've Made</h2>
            {myOffers.map((t) => (
              <div key={t.id} style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  <strong style={{ color: '#f0b429' }}>{castawayNames[t.offered_castaway_id]}</strong> to{' '}
                  {displayNames[t.receiving_user_id]}{' '} for <strong style={{ color: '#f0b429' }}>{castawayNames[t.requested_castaway_id]}</strong>
                  {t.status === 'pending_host_approval' && <span style={{ color: '#a0a0b0' }}> | Pending Host Approval</span>}
                </span>
                <button
                  onClick={() => handleWithdraw(t.id)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#ff6b6b',
                    border: '1px solid #ff6b6b',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Withdraw
                </button>
              </div>
            ))}
          </div>
        )}

        {receivedOffers.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '12px' }}>Offers I've Received</h2>
            {receivedOffers.map((t) => (
              <div key={t.id} style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
  {displayNames[t.proposing_user_id]} offers <strong style={{ color: '#f0b429' }}>{castawayNames[t.offered_castaway_id]}</strong> for{' '}
  <strong style={{ color: '#f0b429' }}>{castawayNames[t.requested_castaway_id]}</strong>
  {t.status === 'pending_host_approval' && <span style={{ color: '#a0a0b0' }}> | Pending Host Approval</span>}
</span>
{t.status === 'pending' && (
  <div style={{ display: 'flex', gap: '8px' }}>
    <button
      onClick={() => handleAccept(t)}
      style={{ backgroundColor: '#068e38', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
    >
      Accept
    </button>
    <button
      onClick={() => handleDecline(t.id)}
      style={{ backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
    >
      Deny
    </button>
  </div>
)}
              </div>
            ))}
          </div>
        )}

        {(isHost || isGlobalAdmin) && pendingApproval.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '12px' }}>Offers to Approve/Deny</h2>
            {pendingApproval.map((t) => (
              <div key={t.id} style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  {displayNames[t.proposing_user_id]} giving <strong style={{ color: '#f0b429' }}>{castawayNames[t.offered_castaway_id]}</strong> to {displayNames[t.receiving_user_id]} for <strong style={{ color: '#f0b429' }}>{castawayNames[t.requested_castaway_id]}</strong>!
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApprove(t)}
                    style={{ backgroundColor: '#068e38', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDeny(t)}
                    style={{ backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <h2 style={{ color: '#f0b429', fontSize: '1.2rem', marginBottom: '12px' }}>Trade History</h2>
          {tradeHistory.length === 0 ? (
            <p style={{ color: '#555570', fontSize: '0.9rem' }}>No trade history yet.</p>
          ) : (
            <>
              {tradeHistory.map((t) => (
                <div key={t.id} style={{
                  backgroundColor: '#12121a',
                  border: '1px solid #2a2a3e',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  color: '#a0a0b0',
                  fontSize: '0.85rem'
                }}>
                 {displayNames[t.proposing_user_id]} offered {castawayNames[t.offered_castaway_id]} to {displayNames[t.receiving_user_id]} for {castawayNames[t.requested_castaway_id]}
                  {' '}—{' '}
                  <span style={{
                    color: t.status === 'accepted' ? '#068e38' : t.status === 'declined' ? '#ff6b6b' : '#555570',
                    fontWeight: 'bold'
                  }}>
{t.status === 'declined' && t.declined_by === 'host' ? 'Denied by Host' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}                  </span>
                </div>
              ))}
              {tradeHistory.length === historyLimit && (
                <button
                  onClick={() => setHistoryLimit((prev) => prev + 10)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#f0b429',
                    border: '1px solid #f0b429',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    marginTop: '8px'
                  }}
                >
                  Load More
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}