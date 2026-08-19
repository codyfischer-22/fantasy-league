'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

export default function JoinLeaguePage() {
  const params = useParams()
  const type = params.type as string
  const token = params.token as string
  const router = useRouter()
  const { user, loading } = useAuth()
  const [leagueName, setLeagueName] = useState<string | null>(null)
  const [status, setStatus] = useState<'checking' | 'error' | 'joining'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function handleJoin() {
const { data: league } = await supabase
  .from('leagues')
  .select('id, name, slug, host_user_id, is_frozen')
  .eq('invite_token', token)
  .eq('is_private', true)
  .single()

if (!league) {
  setStatus('error')
  setMessage('This invite link is invalid or has expired.')
  return
}

if (league.is_frozen) {
  setStatus('error')
  setMessage('This league is currently frozen because the host\u2019s membership dropped below Crew Chief. Please check back later.')
  return
}

      if (!user) {
        localStorage.setItem('pendingInvitePath', `/leagues/${type}/join/${token}`)
        router.push('/signup')
        return
      }

      setStatus('joining')

      const { data: existingMembership } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', league.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingMembership) {
        localStorage.removeItem('pendingInvitePath')
        router.push(`/leagues/${type}/${league.slug}`)
        return
      }

      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('user_id', league.host_user_id)
        .single()

      const hostTier = hostProfile?.tier
      const maxMembers = hostTier === 'teamprincipal' ? 18 : 8

      const { count: currentCount } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id)

      if (currentCount !== null && currentCount >= maxMembers) {
        setStatus('error')
        setMessage(`This league has already reached its ${maxMembers}-players capacity. Consult league host for further information.`)
        return
      }

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('tier, display_name')
        .eq('user_id', user.id)
        .single()

      const { error } = await supabase.from('league_members').insert({
        user_id: user.id,
        league_id: league.id,
        tier_at_join: myProfile?.tier ?? 'stowaway',
      })

      if (error) {
        setStatus('error')
        setMessage('Something went wrong joining this league. Please try again.')
        return
      }

      if (league.host_user_id) {
  await supabase.from('notifications').insert({
    user_id: league.host_user_id,
    message: `${myProfile?.display_name || 'A new Player'} has joined ${league.name}.`,
    link: `/leagues/${type}/${league.slug}`,
  })
}

      localStorage.removeItem('pendingInvitePath')
      router.push(`/leagues/${type}/${league.slug}`)
    }

    if (!loading) {
      handleJoin()
    }
  }, [user, loading, token, type, router])

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
      gap: '16px',
      padding: '40px'
    }}>
      {status === 'error' ? (
        <>
          <div style={{ fontSize: '2.5rem' }}>⚠️</div>
          <p style={{ color: '#ff6b6b', textAlign: 'center', maxWidth: '400px' }}>{message}</p>
          <a href={`/leagues/${type}`} style={{ color: '#f0b429' }}>← Back to 🏝️ Politics on the Beach</a>
        </>
      ) : (
        <p>Joining your league...</p>
      )}
    </main>
  )
}