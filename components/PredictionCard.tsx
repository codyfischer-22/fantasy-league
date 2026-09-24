'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { Dices } from 'lucide-react'

type Castaway = {
  id: number
  name: string
  status: string
}

type Props = {
  leagueId: number
  leagueType: string
  instanceSlug: string
}

const castawayTermByLeague: Record<string, string> = {
  'secrets-on-the-beach': 'Castaway',
  'sotb-demo': 'Castaway',
  'uncharted-turretory': 'Castle-Goer',
  'uncharted-turretory-demo': 'Castle-Goer',
  'sandbox': 'Contestant',
}

const episodeAirTimeByLeague: Record<string, { dayOfWeek: number; hour: number }> = {
  'secrets-on-the-beach': { dayOfWeek: 3, hour: 19 }, // Wednesday, 7 PM
  'uncharted-turretory': { dayOfWeek: 4, hour: 19 }, // Thursday, 7 PM
}

export default function PredictionCard({ leagueId, leagueType, instanceSlug }: Props) {  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentEpisode, setCurrentEpisode] = useState<number | null>(null)
  const [allCastaways, setAllCastaways] = useState<Castaway[]>([])
  const [activeCastaways, setActiveCastaways] = useState<Castaway[]>([])
  const [selectedCastawayId, setSelectedCastawayId] = useState<string>('')
  const [existingPrediction, setExistingPrediction] = useState<{
    predicted_castaway_id: number
    is_correct: boolean | null
    actual_eliminated_castaway_id: number | null
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const castawayTerm = castawayTermByLeague[leagueType] ?? 'Contestant'

function isLocked(leagueType: string): boolean {
  const config = episodeAirTimeByLeague[leagueType]
  if (!config) return false

  const now = new Date()
  const centralTimeString = now.toLocaleString('en-US', { timeZone: 'America/Chicago' })
  const centralNow = new Date(centralTimeString)

  const daysSinceAirDay = (centralNow.getDay() - config.dayOfWeek + 7) % 7

  const mostRecentAirTime = new Date(centralNow)
  mostRecentAirTime.setDate(centralNow.getDate() - daysSinceAirDay)
  mostRecentAirTime.setHours(config.hour, 0, 0, 0)

  if (mostRecentAirTime > centralNow) {
    mostRecentAirTime.setDate(mostRecentAirTime.getDate() - 7)
  }

  const hoursSinceAir = (centralNow.getTime() - mostRecentAirTime.getTime()) / (1000 * 60 * 60)

  return hoursSinceAir >= 0 && hoursSinceAir < 24
}

function isPastLockTime(leagueType: string): boolean {
  const config = episodeAirTimeByLeague[leagueType]
  if (!config) return false

  const now = new Date()
  const centralTimeString = now.toLocaleString('en-US', { timeZone: 'America/Chicago' })
  const centralNow = new Date(centralTimeString)

  const currentDay = centralNow.getDay()
  const currentHour = centralNow.getHours()

  if (currentDay > config.dayOfWeek) return true
  if (currentDay === config.dayOfWeek && currentHour >= config.hour) return true
  return false
}

const locked = isLocked(leagueType)

useEffect(() => {
    async function loadPredictionState() {
      if (!user) {
        setLoading(false)
        return
      }

      const { data: scoreRows } = await supabase
        .from('episode_scores')
        .select('episode_number')
        .eq('league_type', leagueType)
        .order('episode_number', { ascending: false })
        .limit(1)

      const highestScored = scoreRows && scoreRows.length > 0 ? scoreRows[0].episode_number : 0
      const nextEpisode = Math.floor(highestScored) + 1
      setCurrentEpisode(nextEpisode)

      const { data: castawayList } = await supabase
  .from('castaways')
  .select('id, name, status')
  .eq('league_type', leagueType)
  .eq('status', 'active')
  .order('name')
setActiveCastaways(castawayList ?? [])

     const { data: allCastawayList } = await supabase
  .from('castaways')
  .select('id, name, status')
  .eq('league_type', leagueType)
setAllCastaways(allCastawayList ?? [])

      const { data: existing } = await supabase
        .from('predictions')
        .select('predicted_castaway_id, is_correct, actual_eliminated_castaway_id')
        .eq('league_id', leagueId)
        .eq('user_id', user.id)
        .eq('episode_number', nextEpisode)
        .maybeSingle()

      setExistingPrediction(existing ?? null)
      setLoading(false)
    }
    loadPredictionState()
  }, [user, leagueId, leagueType, instanceSlug])

  const handleSubmit = async () => {
    if (!user || !selectedCastawayId || !currentEpisode) return
    setSubmitting(true)
    setMessage('')

    const { error } = await supabase.from('predictions').insert({
      league_id: leagueId,
      user_id: user.id,
      episode_number: currentEpisode,
      predicted_castaway_id: parseInt(selectedCastawayId),
    })

    setSubmitting(false)

      if (error) {
    console.error('Prediction insert error:', error)
    setMessage('Something went wrong submitting your prediction. Please try again.')
  } else {
    setExistingPrediction({
      predicted_castaway_id: parseInt(selectedCastawayId),
      is_correct: null,
      actual_eliminated_castaway_id: null,
    })
  }
}

  if (!user) return null

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: '#1a1a2e',
          border: '1px solid #f0b429',
          color: '#f0b429',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          cursor: 'pointer',
          marginBottom: '24px',
          marginTop: '-16px',
          width: '100%'
        }}
      >
        <Dices size={18} strokeWidth={2} /> Weekly Prediction Mini-Game
      </button>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #f0b429',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%'
            }}
          >
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
  <h3 style={{ color: '#f0b429', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
    <Dices size={20} strokeWidth={2} /> Episode {currentEpisode} Prediction
  </h3>

  <a
    href={`/leagues/${leagueType}/${instanceSlug}/predictions`}
    style={{
      color: '#a0a0b0',
      fontSize: '0.8rem',
      textDecoration: 'underline',
      whiteSpace: 'nowrap'
    }}
  >
    Leaderboard →
  </a>
</div>

            {loading ? (
              <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Loading...</p>
            ) : existingPrediction ? (
              <div>
                <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: existingPrediction.is_correct === null ? '0' : '8px' }}>
                  Your Prediction:{' '}
                  <strong style={{ color: '#ffffff' }}>
{allCastaways.find((c) => c.id === existingPrediction.predicted_castaway_id)?.name ?? 'your pick'}                  </strong>
                </p>
                {existingPrediction.is_correct === true && (
                  <p style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.9rem' }}>✅ Wow! You nailed it!</p>
                )}
                {existingPrediction.is_correct === false && (
                  <p style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '0.9rem' }}>❌ Better luck next time!</p>
                )}
                {existingPrediction.is_correct === null && (
                  <p style={{ color: '#555570', fontSize: '0.85rem' }}>Prediction logged! Now watch to see if you were right!</p>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    marginTop: '16px',
                    backgroundColor: 'transparent',
                    color: '#a0a0b0',
                    border: '1px solid #2a2a3e',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Close
                </button>
              </div>


            ) : locked ? (
  <div>
    <p style={{ color: '#555570', fontSize: '0.9rem' }}>
      Predictions are locked from the start of the episode for 24 hours. You're too late or too early!
    </p>
    <button
      onClick={() => setShowModal(false)}
      style={{
        marginTop: '16px',
        backgroundColor: 'transparent',
        color: '#a0a0b0',
        border: '1px solid #2a2a3e',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        width: '100%'
      }}
    >
      Close
    </button>
  </div>
) : (
  <>
    <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '6px' }}>
       Who do you think will be eliminated next episode?
    </p>
    <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '6px' }}>
       Whoever has the most correct predictions gets to split the +50 point bonus.
    </p>
    <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '14px' }}>
       You can still play after all roster players poof!
    </p>

    <select
      value={selectedCastawayId}
      onChange={(e) => setSelectedCastawayId(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: '6px',
        border: '1px solid #2a2a3e',
        backgroundColor: '#12121a',
        color: '#ffffff',
        fontSize: '0.9rem',
        marginBottom: '12px'
      }}
    >
      <option value="" disabled>Select {castawayTerm}...</option>
      {activeCastaways.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
    <div style={{ display: 'flex', gap: '10px' }}>
      <button
        onClick={handleSubmit}
        disabled={!selectedCastawayId || submitting}
        style={{
          backgroundColor: '#f0b429',
          color: '#0a0a0f',
          padding: '10px 20px',
          borderRadius: '6px',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          flex: 1
        }}
      >
        {submitting ? 'Submitting...' : 'Lock In'}
      </button>
      <button
        onClick={() => setShowModal(false)}
        style={{
          backgroundColor: 'transparent',
          color: '#a0a0b0',
          border: '1px solid #2a2a3e',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Cancel
      </button>
    </div>
    {message && (
      <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '10px' }}>{message}</p>
    )}
  </>
)}
     </div>
        </div>
      )}
    </>
  )
}