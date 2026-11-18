import { supabase } from '@/lib/supabase'

// Emails a private league's host when someone late-joins or rejoins.
// (Bell notifications come from the database. Public leagues notify admins by bell only, like normal joins.)
export async function emailHostAboutJoin(leagueId: number, kind: 'late_join' | 'rejoin') {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: league } = await supabase
      .from('leagues')
      .select('name, slug, league_type, is_private, host_user_id')
      .eq('id', leagueId)
      .single()
    if (!league?.is_private || !league.host_user_id || league.host_user_id === user.id) return

    const { data: host } = await supabase
      .from('profiles')
      .select('email, display_name, email_opt_in')
      .eq('user_id', league.host_user_id)
      .single()
    if (!host?.email_opt_in) return

    const { data: me } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single()
    const who = me?.display_name || 'A player'

    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/send-notification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        recipients: [{ email: host.email, playerName: host.display_name || 'Host' }],
        subject: kind === 'rejoin' ? `${who} rejoined ${league.name}` : `A new player joined ${league.name}!`,
        message: kind === 'rejoin'
          ? `${who} has rejoined ${league.name}. Their roster was restored wherever their picks were still available.`
          : `${who} joined ${league.name} after the draft and claimed their roster from available free agents.`,
        linkUrl: `https://trekkonleagues.com/leagues/${league.league_type}/${league.slug}`,
        linkText: 'View League →',
      }),
    })
  } catch (e) {
    console.error('Host email failed:', e)   // the join still worked; only the email failed
  }
}