'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type RosterMember = {
  user_id: string
  display_name: string | null
  tier: string
  castaways: string[]
}

type DepartedMember = {
  user_id: string
  display_name: string
  castaways: string[]
}

const tierLabels: Record<string, string> = {
  stowaway: 'Stowaway',
  castaway: 'Castaway',
  crewchief: 'Crew Chief',
  teamprincipal: 'Team Principal',
}

export default function RosterPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string

  const [departed, setDeparted] = useState<DepartedMember[]>([])
  const [leagueName, setLeagueName] = useState('')
  const [roster, setRoster] = useState<RosterMember[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    async function loadRoster() {
      const { data: league } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()

      if (!league) {
        setPageLoading(false)
        return
      }

      setLeagueName(league.name)

      const { data: members } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', league.id)

      const activeUserIds = new Set((members ?? []).map((m) => m.user_id))

      if (members && members.length > 0) {
        const userIds = members.map((m) => m.user_id)

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, tier')
          .in('user_id', userIds)

        const { data: picks } = await supabase
          .from('draft_picks')
          .select('user_id, castaway_id')
          .eq('league_id', league.id)

        const castawayIds = [...new Set((picks ?? []).map((p) => p.castaway_id))]

        const { data: castawayList } = castawayIds.length > 0
          ? await supabase.from('castaways').select('id, name').in('id', castawayIds)
          : { data: [] }

        const castawayNameMap = new Map(
          (castawayList ?? []).map((c) => [c.id, c.name])
        )

        const rosterWithTeams = (profiles ?? []).map((profile) => {
          const userPicks = (picks ?? []).filter((p) => p.user_id === profile.user_id)
          const castawayNames = userPicks
            .map((p) => castawayNameMap.get(p.castaway_id))
            .filter((name): name is string => !!name)

          return {
            ...profile,
            castaways: castawayNames,
          }
        })

        setRoster(rosterWithTeams)
      }

      // Find departed Players: anyone with draft_picks for this league who is no longer a member
      const { data: allPicks } = await supabase
        .from('draft_picks')
        .select('user_id, castaway_id')
        .eq('league_id', league.id)

      const departedUserIds = [...new Set(
        (allPicks ?? [])
          .map((p) => p.user_id)
          .filter((id) => !activeUserIds.has(id))
      )]

      if (departedUserIds.length > 0) {
        const { data: departedProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', departedUserIds)

        const departedCastawayIds = [...new Set(
          (allPicks ?? [])
            .filter((p) => departedUserIds.includes(p.user_id))
            .map((p) => p.castaway_id)
        )]

        const { data: departedCastawayList } = await supabase
          .from('castaways')
          .select('id, name')
          .in('id', departedCastawayIds)

        const departedCastawayMap = new Map((departedCastawayList ?? []).map((c) => [c.id, c.name]))

        const departedWithTeams = departedUserIds.map((uid) => {
          const profile = (departedProfiles ?? []).find((p) => p.user_id === uid)
          const picks = (allPicks ?? []).filter((p) => p.user_id === uid)
          const names = picks.map((p) => departedCastawayMap.get(p.castaway_id)).filter((n): n is string => !!n)

          return {
            user_id: uid,
            display_name: profile?.display_name || 'Unnamed Player',
            castaways: names,
          }
        })

        setDeparted(departedWithTeams)
      }

      setPageLoading(false)
    }

    loadRoster()
  }, [type, instance])

  if (pageLoading) {
    return (
      <main style={{
        backgroundColor: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a0a0b0',
        fontFamily: 'Georgia, serif'
      }}>
        Loading...
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

        <a href={`/leagues/${type}/${instance}`} style={{
          color: '#a0a0b0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ← Back to {leagueName || 'League'}
        </a>

        <h1 style={{ color: '#f0b429', fontSize: '2.25rem', marginBottom: '32px' }}>
          👥 League Roster
        </h1>

        {roster.length === 0 ? (
          <p style={{ color: '#555570' }}>No players have joined this league yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {roster.map((member) => (
              <div key={member.user_id} style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '10px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {member.display_name || 'Unnamed Player'}
                  </div>
                  <div style={{
                    backgroundColor: '#12121a',
                    color: '#f0b429',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {tierLabels[member.tier] ?? member.tier}
                  </div>
                </div>
                {member.castaways.length > 0 ? (
                  <p style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
                    Tribe: {member.castaways.join(', ')}
                  </p>
                ) : (
                  <p style={{ color: '#555570', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Tribe: Pending the draft!
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {departed.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ color: '#555570', fontSize: '1.1rem', marginBottom: '16px' }}>
              Departed Players
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {departed.map((member) => (
                <div key={member.user_id} style={{
                  backgroundColor: '#12121a',
                  border: '1px solid #2a2a3e',
                  borderRadius: '10px',
                  padding: '16px 20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1rem', color: '#555570' }}>
                      {member.display_name}
                    </div>
                    <div style={{
                      backgroundColor: '#1a1a2e',
                      color: '#555570',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      Left League
                    </div>
                  </div>
                  <p style={{ color: '#3a3a44', fontSize: '0.8rem' }}>
                    Tribe (Out of Play): {member.castaways.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}