'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

export default function LeagueSettingsPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const router = useRouter()
  const { user, loading } = useAuth()

  const [league, setLeague] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)

  const [pickTimerSeconds, setPickTimerSeconds] = useState('')
  const [requireAdminApproval, setRequireAdminApproval] = useState(false)
  const [draftOrderMethod, setDraftOrderMethod] = useState('random')
  const [guaranteeFullCoverage, setGuaranteeFullCoverage] = useState(false)
  const [missedPickBehavior, setMissedPickBehavior] = useState('bump_to_back')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState<{ user_id: string; display_name: string }[]>([])

  useEffect(() => {
    async function loadLeague() {
      if (!user) {
        setPageLoading(false)
        return
      }

      const { data: leagueData } = await supabase
        .from('leagues')
        .select('*')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()

      if (!leagueData || leagueData.host_user_id !== user.id) {
        router.push(`/leagues/${type}/${instance}`)
        return
      }

      if (!leagueData || leagueData.host_user_id !== user.id) {
  router.push(`/leagues/${type}/${instance}`)
  return
}

if (leagueData.is_frozen) {
  router.push(`/leagues/${type}/${instance}`)
  return
}

      setLeague(leagueData)
      setIsHost(true)
      setPickTimerSeconds(leagueData.pick_timer_seconds ? String(leagueData.pick_timer_seconds) : '')
      setRequireAdminApproval(leagueData.require_admin_approval ?? false)
      setDraftOrderMethod(leagueData.draft_order_method ?? 'random')
      setGuaranteeFullCoverage(leagueData.guarantee_full_coverage ?? false)
      setMissedPickBehavior(leagueData.missed_pick_behavior ?? 'bump_to_back')

      const { data: memberRows } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', leagueData.id)

      if (memberRows && memberRows.length > 0) {
        const memberIds = memberRows.map((m) => m.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', memberIds)

        setMembers(
          (profiles ?? []).map((p) => ({
            user_id: p.user_id,
            display_name: p.display_name || 'Unnamed Player',
          }))
        )
      }

      setPageLoading(false)
    }

    if (!loading) {
      loadLeague()
    }
  }, [user, loading, type, instance, router])

  const handleSave = async () => {
    if (!league) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('leagues')
      .update({
        pick_timer_seconds: pickTimerSeconds ? parseInt(pickTimerSeconds) : null,
        require_admin_approval: requireAdminApproval,
        draft_order_method: draftOrderMethod,
        guarantee_full_coverage: guaranteeFullCoverage,
        missed_pick_behavior: missedPickBehavior,
      })
      .eq('id', league.id)

    setSaving(false)

    if (error) {
      setMessage('Something went wrong saving your settings. Please try again.')
    } else {
      setMessage('Settings saved!')
    }
  }

  const handleEjectPlayer = async (playerUserId: string, playerName: string) => {
    if (!league) return

    const confirmed = window.confirm(`Are you sure you want to remove ${playerName} from this league? There is no guarantee they'll be able to re-join without losing league data.`)
    if (!confirmed) return

    await supabase
      .from('draft_rankings')
      .delete()
      .eq('league_id', league.id)
      .eq('user_id', playerUserId)

    await supabase
      .from('league_members')
      .delete()
      .eq('league_id', league.id)
      .eq('user_id', playerUserId)

    await supabase.from('notifications').insert({
      user_id: playerUserId,
      message: `You've been removed from ${league.name} by the host. Reach out to your host personally with any questions.`,
      link: `/leagues-overview`,
    })

    setMembers((prev) => prev.filter((m) => m.user_id !== playerUserId))
  }

  const handleCancelLeague = async () => {
    if (!user || !league) return

    const confirmed = window.confirm(
      'Are you sure you want to permanently cancel/delete this league? This cannot be undone and data will not be archived.'
    )
    if (!confirmed) return

    await supabase.from('draft_picks').delete().eq('league_id', league.id)
    await supabase.from('draft_rankings').delete().eq('league_id', league.id)
    await supabase.from('league_members').delete().eq('league_id', league.id)

    const { error } = await supabase.from('leagues').delete().eq('id', league.id)

    if (error) {
      alert('Something went wrong canceling this league. Please try again.')
    } else {
      router.push(`/leagues/${type}`)
    }
  }

  const labelStyle = { display: 'block', color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '6px' }
  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '6px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#12121a',
    color: '#ffffff'
  }
  const selectStyle = {
    ...inputStyle,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f0b429' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '16px',
    paddingRight: '28px'
  }

  if (loading || pageLoading) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  if (!isHost) {
    return null
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '40px 20px' }}>
      <div style={{ backgroundColor: '#1a1a2e', border: '1px solid #f0b429', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '480px' }}>
        <a href={`/leagues/${type}/${instance}`} style={{ color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← Back to {league?.name}
        </a>

        <h1 style={{ color: '#f0b429', fontSize: '1.8rem', marginBottom: '24px', textAlign: 'center' }}>
          League Settings
        </h1>

        <label style={labelStyle}>Selection Timer for Each Draft Pick</label>
        <select value={pickTimerSeconds} onChange={(e) => setPickTimerSeconds(e.target.value)} style={selectStyle}>
          <option value="">No Limit</option>
          <option value="120">2 Minutes</option>
          <option value="300">5 Minutes</option>
          <option value="900">15 Minutes</option>
          <option value="3600">1 Hour</option>
          <option value="10800">3 Hours</option>
        </select>

        <label style={labelStyle}>If Selection Timer Runs Out</label>
        <select value={missedPickBehavior} onChange={(e) => setMissedPickBehavior(e.target.value)} style={selectStyle}>
          <option value="bump_to_back">Bump Pick to Back of Draft</option>
          <option value="random_select">Randomly Assign Pick</option>
        </select>

        <label style={labelStyle}>Draft Order</label>
        <select value={draftOrderMethod} onChange={(e) => setDraftOrderMethod(e.target.value)} style={selectStyle}>
          <option value="random">Randomize</option>
          <option value="host_set">Manually Set Order</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
          <input type="checkbox" checked={requireAdminApproval} onChange={(e) => setRequireAdminApproval(e.target.checked)} style={{ marginTop: '3px' }} />
          <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
            <strong>OPTIONAL:</strong> Require host approval for every pick.
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '24px', cursor: 'pointer' }}>
          <input type="checkbox" checked={guaranteeFullCoverage} onChange={(e) => setGuaranteeFullCoverage(e.target.checked)} style={{ marginTop: '3px' }} />
          <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
            <strong>OPTIONAL:</strong> Require every player to be drafted if more than 4 league players. <em>(Castaways will be cloned as necessary to give all tribes 4 unique players.)</em>
          </span>
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            marginBottom: '-6px'
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {message && (
          <p style={{ color: '#f0b429', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
            {message}
          </p>
        )}

        <div style={{ marginTop: '32px', paddingTop: '15px', borderTop: '3px solid #fff' }}>
          <p style={{ color: '#ff6b6b', fontSize: '1rem', marginBottom: '10px', textAlign: 'center' }}>
         ☠️ <strong>Warning:</strong> You are entering exile territory.
          </p>

   <button
  onClick={() => setShowMembers(!showMembers)}
  style={{
    width: '100%',
    backgroundColor: 'transparent',
    color: 'rgb(245, 181, 18)',
    border: '1px solid rgb(245, 181, 18)',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '10px'
  }}
>
  {showMembers ? 'Hide' : 'Exile'} League Members ({members.length})
</button>

          {showMembers && (
            <div style={{ marginTop: '12px' }}>
              {members.map((m) => (
                <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #2a2a3e' }}>
                  <span style={{ fontSize: '0.85rem' }}>{m.display_name}</span>
                  {m.user_id !== user?.id && (
                    <button
                      onClick={() => handleEjectPlayer(m.user_id, m.display_name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff6b6b',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Eject
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

          <button
            onClick={handleCancelLeague}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: '#ff6b6b',
              border: '2px solid #ff6b6b',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Scrap League
          </button>
      </div>
    </main>
  )
}