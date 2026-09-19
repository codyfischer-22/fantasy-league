'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sparkles, Trophy } from 'lucide-react'

type PredictionStanding = {
  user_id: string
  display_name: string
  total: number
  correct: number
}

export default function PredictionLeaderboardPage() {
  const params = useParams()
  const type = params.type as string
  const instance = params.instance as string
  const [loading, setLoading] = useState(true)
  const [standings, setStandings] = useState<PredictionStanding[]>([])
  const [leagueName, setLeagueName] = useState('')

  useEffect(() => {
    async function loadStandings() {
      const { data: league } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('league_type', type)
        .eq('slug', instance)
        .single()

      if (!league) {
        setLoading(false)
        return
      }
      setLeagueName(league.name)

      const { data: members } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', league.id)

      if (!members || members.length === 0) {
        setLoading(false)
        return
      }

      const memberIds = members.map((m) => m.user_id)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', memberIds)

      const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name || 'Unnamed Player']))

      const { data: predictions } = await supabase
        .from('predictions')
        .select('user_id, is_correct')
        .eq('league_id', league.id)
        .not('is_correct', 'is', null)

      const statsByUser = new Map<string, { total: number; correct: number }>()
      ;(predictions ?? []).forEach((p) => {
        const existing = statsByUser.get(p.user_id) ?? { total: 0, correct: 0 }
        existing.total += 1
        if (p.is_correct) existing.correct += 1
        statsByUser.set(p.user_id, existing)
      })

  const results: PredictionStanding[] = Array.from(statsByUser.entries()).map(([uid, stats]) => ({
  user_id: uid,
  display_name: nameMap.get(uid) ?? 'Unnamed Player',
  total: stats.total,
  correct: stats.correct,
}))

results.sort((a, b) => b.correct - a.correct)

      setStandings(results)
      setLoading(false)
    }
    loadStandings()
  }, [type, instance])

  if (loading) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <a href={`/leagues/${type}/${instance}`} style={{
          color: '#a0a0b0', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px'
        }}>
          ← Back to {leagueName || 'League'}
        </a>

        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={36} strokeWidth={2} color="#f0b429" />
          <span style={{ color: '#f0b429' }}>Prediction</span>{' '}
          <span style={{ color: '#ffffff' }}>Leaderboard</span>
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px' }}>
  Correctly predict who's going home each week for a chance to win +50 bonus points!
</p>

        {standings.length === 0 ? (
          <p style={{ color: '#555570' }}>No results yet. Check back once episodes and scores come in!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {standings.map((s, idx) => (
  <div key={s.user_id} style={{
    backgroundColor: '#1a1a2e',
    border: idx === 0 ? '2px solid #f0b429' : '1px solid #2a2a3e',
    borderRadius: '10px',
    padding: '16px 20px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {idx === 0 && (
          <Trophy size={18} strokeWidth={2} color="#f0b429" />
        )}
        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{s.display_name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          backgroundColor: '#12121a',
          color: '#f0b429',
          padding: '4px 12px',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}>
          {s.correct} Correct
        </span>
        <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
          ({s.total} Guessed)
        </span>
      </div>
    </div>
  </div>
))}
          </div>
        )}
      </div>
    </main>
  )
}
