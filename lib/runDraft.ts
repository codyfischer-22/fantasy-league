import { supabase } from '@/lib/supabase'

type DraftLeague = {
  id: number
  name: string
  league_type: string
  slug: string
  draft_mode?: string | null
}

// Runs an offline draft or starts a live draft, then emails opted-in players.
// Used by the league page AND the admin Leagues page, so both behave the same.
export async function runLeagueDraft(league: DraftLeague): Promise<{ error: string | null; isAuto: boolean }> {
  const isAuto = league.draft_mode === 'auto'

  const { error } = await supabase.rpc(isAuto ? 'run_auto_draft' : 'start_draft', { p_league_id: league.id })
  if (error) return { error: error.message, isAuto }

    // A live draft can finish instantly if every player chose "draft for me right away"
  let finishedAtStart = false
  if (!isAuto) {
    const { data: after } = await supabase.from('leagues').select('draft_status').eq('id', league.id).single()
    finishedAtStart = after?.draft_status === 'completed'
  }
  const sendAsComplete = isAuto || finishedAtStart

  // Emails (in-app notifications are already sent by the database)
  try {
    const { data: members } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', league.id)
    const memberIds = (members ?? []).map((m) => m.user_id)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, display_name, email_opt_in')
      .in('user_id', memberIds)
      .eq('email_opt_in', true)

    if (profiles && profiles.length > 0) {
      const { data: { session } } = await supabase.auth.getSession()
      const base = `https://trekkonleagues.com/leagues/${league.league_type}/${league.slug}`

      await fetch('/api/send-notification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          recipients: profiles.map((p) => ({
            email: p.email,
            playerName: p.display_name || 'Player',
          })),
          subject: sendAsComplete ? `Draft results for ${league.name} are live!` : `The ${league.name} draft has started!`,
          message: sendAsComplete
            ? `It's official! The draft for ${league.name} is complete. Check out your roster, make trade offers, and get ready for the season!`
            : `That's right, silly season is upon us! The draft for ${league.name} has started. Head to the draft room and make your picks!`,
          linkUrl: sendAsComplete ? `${base}/leaderboard` : `${base}/draft-room`,
          linkText: sendAsComplete ? 'View Leaderboard →' : 'Go to Draft Room →',
        }),
      })
    }
  } catch (e) {
    console.error('Draft email failed:', e)   // the draft still ran; only the email failed
  }

   return { error: null, isAuto: sendAsComplete }
}