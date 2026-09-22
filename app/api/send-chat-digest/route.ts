import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NotificationEmail } from '@/components/emails/NotificationEmail'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: optedInProfiles } = await supabaseAdmin
    .from('profiles')
    .select('user_id, email, display_name')
    .eq('chat_digest_opt_in', true)

  if (!optedInProfiles || optedInProfiles.length === 0) {
    return Response.json({ sent: 0 })
  }

  let sentCount = 0

  for (const profile of optedInProfiles) {
    const { data: memberships } = await supabaseAdmin
      .from('league_members')
      .select('league_id')
      .eq('user_id', profile.user_id)

    if (!memberships || memberships.length === 0) continue

    const leagueIds = memberships.map((m) => m.league_id)

    const { data: leagues } = await supabaseAdmin
      .from('leagues')
      .select('id, name, league_type, slug')
      .in('id', leagueIds)

    const { data: recentMessages } = await supabaseAdmin
      .from('messages')
      .select('league_id, content, user_id, created_at')
      .in('league_id', leagueIds)
      .gte('created_at', oneWeekAgo)

    if (!recentMessages || recentMessages.length === 0) continue

    const messagesByLeague: Record<number, number> = {}
    recentMessages.forEach((m) => {
      messagesByLeague[m.league_id] = (messagesByLeague[m.league_id] ?? 0) + 1
    })

    const summaryLines = (leagues ?? [])
      .filter((l) => messagesByLeague[l.id])
      .map((l) => `${l.name}: ${messagesByLeague[l.id]} New Message${messagesByLeague[l.id] === 1 ? '' : 's'}`)
      .join('\n')

    if (!summaryLines) continue

    await resend.emails.send({
      from: 'Trekkon Fantasy Leagues <notifications@trekkonleagues.com>',
      replyTo: 'hello@trekkonleagues.com',
      to: [profile.email],
      subject: `Keep up with your fantasy league chat!`,
      react: NotificationEmail({
        playerName: profile.display_name || 'Player',
        message: `Your league chat's been active this week!\n\n${summaryLines}`,
        linkUrl: 'https://trekkonleagues.com/leagues-overview',
        linkText: 'Catch Up on Chat →',
      }),
    })

    sentCount++
  }

  return Response.json({ sent: sentCount })
}