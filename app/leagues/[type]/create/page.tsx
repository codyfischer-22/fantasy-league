'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

const leagueTypeEmojis: Record<string, string> = {
  'politics-on-the-beach': '🌴',
  'americans-turning-left': '🚗',
  'european-rocket-ships': '🏎️',
}

export default function CreateLeaguePage() {
  const params = useParams()
  const type = params.type as string
  const router = useRouter()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [pickTimerSeconds, setPickTimerSeconds] = useState('')
  const [requireAdminApproval, setRequireAdminApproval] = useState(false)
  const [draftOrderMethod, setDraftOrderMethod] = useState('random')
  const [guaranteeFullCoverage, setGuaranteeFullCoverage] = useState(false)
  const [agreedToHostResponsibly, setAgreedToHostResponsibly] = useState(false)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [missedPickBehavior, setMissedPickBehavior] = useState('bump_to_back')

  const requiredEmoji = leagueTypeEmojis[type] ?? ''



const strippedName = name
  .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
  .trim()

const finalName = requiredEmoji ? `${requiredEmoji} ${strippedName}` : strippedName



  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!agreedToHostResponsibly) {
      setMessage('You must check the required host agreement box to create a league.')
      return
    }

    setCreating(true)
    setMessage('')

const { data: profile } = await supabase
  .from('profiles')
  .select('tier, is_global_admin')
  .eq('user_id', user.id)
  .single()

const tier = profile?.tier
const isAdmin = profile?.is_global_admin ?? false

if (!isAdmin && tier !== 'crewchief' && tier !== 'teamprincipal') {
  setMessage('You must be Crew Chief or Team Principal to host a private league.')
  setCreating(false)
  return
}

if (!isAdmin) {
  const { count: existingLeagueCount } = await supabase
    .from('leagues')
    .select('*', { count: 'exact', head: true })
    .eq('host_user_id', user.id)
    .eq('league_type', type)
    .eq('is_private', true)

  const maxConcurrent = tier === 'teamprincipal' ? 3 : 1

  if (existingLeagueCount !== null && existingLeagueCount >= maxConcurrent) {
    setMessage(`You can only host ${maxConcurrent} ${maxConcurrent === 1 ? 'league' : 'leagues'} of this type at a time.`)
    setCreating(false)
    return
  }
}

    const slug = finalName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 6)

    const { data: newLeague, error } = await supabase
      .from('leagues')
      .insert({
        name: finalName,
        slug,
        league_type: type,
        is_private: true,
        host_user_id: user.id,
        invite_token: crypto.randomUUID(),
        pick_timer_seconds: pickTimerSeconds ? parseInt(pickTimerSeconds) : null,
        require_admin_approval: requireAdminApproval,
        draft_order_method: draftOrderMethod,
        guarantee_full_coverage: guaranteeFullCoverage,
        missed_pick_behavior: missedPickBehavior,
      })
      .select()
      .single()

    if (error || !newLeague) {
      setMessage('Something went wrong creating your league. Please try again.')
      setCreating(false)
      return
    }

    await supabase.from('league_members').insert({
      user_id: user.id,
      league_id: newLeague.id,
      tier_at_join: tier,
    })

    setCreating(false)
    router.push(`/leagues/${type}/${newLeague.slug}`)
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

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      padding: '40px 20px'
    }}>
      <form onSubmit={handleCreate} style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px'
      }}>
        <h1 style={{ color: '#f0b429', fontSize: '1.8rem', marginBottom: '24px', textAlign: 'center' }}>
          Create Your League
        </h1>

        <label style={labelStyle}>League Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="(e.g. The Beach Bums)"
          style={inputStyle}
        />

        <label style={labelStyle}>Selection Timer for Each Draft Pick</label>
        <select
          value={pickTimerSeconds}
          onChange={(e) => setPickTimerSeconds(e.target.value)}
          style={selectStyle}
        >
          <option value="">No Limit</option>
          <option value="120">2 Minutes</option>
          <option value="300">5 Minutes</option>
          <option value="900">15 Minutes</option>
          <option value="3600">1 Hour</option>
          <option value="10800">3 Hours</option>
        </select>

               <label style={labelStyle}>If Selection Timer Runs Out</label>
<select
  value={missedPickBehavior}
  onChange={(e) => setMissedPickBehavior(e.target.value)}
  style={selectStyle}
>
  <option value="bump_to_back">Bump Pick to Back of Draft</option>
  <option value="random_select">Randomly Assign Pick</option>
</select>

        <label style={labelStyle}>Draft Order</label>
        <select
          value={draftOrderMethod}
          onChange={(e) => setDraftOrderMethod(e.target.value)}
          style={selectStyle}
        >
          <option value="random">Randomize</option>
          <option value="host_set">Manually Set Order</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={requireAdminApproval}
            onChange={(e) => setRequireAdminApproval(e.target.checked)}
            style={{ marginTop: '3px' }}
          />
         <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
  <strong>OPTIONAL:</strong> Require host approval for every pick.
</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '24px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={guaranteeFullCoverage}
            onChange={(e) => setGuaranteeFullCoverage(e.target.checked)}
            style={{ marginTop: '3px' }}
          />
        <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
  <strong>OPTIONAL:</strong> Require every player to be drafted if more than 4 league players. <em>(Castaways will be cloned as necessary to give all tribes 4 unique players.)</em>
</span>
        </label>
        
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '24px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={agreedToHostResponsibly}
            onChange={(e) => setAgreedToHostResponsibly(e.target.checked)}
            style={{ marginTop: '3px' }}
          />
        <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
  <strong>REQUIRED:</strong> I understand this league and the members I invite in are my responsibility. I will strive to communicate effectively, start and coordinate draft process, and be generally present for the duration of the league.
</span>
        </label>

        <button
          type="submit"
          disabled={creating}
          style={{
            width: '100%',
            backgroundColor: '#f0b429',
            color: '#0a0a0f',
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: creating ? 'not-allowed' : 'pointer'
          }}
        >
          {creating ? 'Creating...' : 'Create League'}
        </button>

        {message && (
          <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
            {message}
          </p>
        )}
      </form>
    </main>
  )
}