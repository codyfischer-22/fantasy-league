import { NextResponse } from 'next/server'
import { supabaseAdmin, requireGlobalAdmin, listAllAuthUsers, TIERS, LEAGUE_TYPES } from '@/lib/adminServer'

// GET: every player's profile, plus join date and last sign-in
export async function GET(req: Request) {
  const adminId = await requireGlobalAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id, display_name, email, tier, is_global_admin, is_league_admin, admin_league_types, email_opt_in')
    .order('display_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const authUsers = await listAllAuthUsers()
  const authById = new Map(authUsers.map((u) => [u.id, u]))

  const players = (profiles ?? []).map((p) => ({
    ...p,
    tier: p.tier ?? 'stowaway',
    admin_league_types: p.admin_league_types ?? [],
    joined_at: authById.get(p.user_id)?.created_at ?? null,
    last_sign_in_at: authById.get(p.user_id)?.last_sign_in_at ?? null,
  }))

  return NextResponse.json({ players })
}

// PATCH: change one player's tier and/or League Admin access
export async function PATCH(req: Request) {
  const adminId = await requireGlobalAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.user_id) return NextResponse.json({ error: 'Missing player.' }, { status: 400 })

  const update: Record<string, unknown> = {}

  if (body.tier !== undefined) {
    if (!TIERS.includes(body.tier)) {
      return NextResponse.json({ error: 'Unknown tier.' }, { status: 400 })
    }
    update.tier = body.tier
  }

  if (body.is_league_admin !== undefined) {
    update.is_league_admin = Boolean(body.is_league_admin)
    const types: string[] = Array.isArray(body.admin_league_types) ? body.admin_league_types : []
    const clean = types.filter((t) => (LEAGUE_TYPES as readonly string[]).includes(t))
    // Turning League Admin off also clears which leagues they could score
    update.admin_league_types = update.is_league_admin ? clean : []
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('profiles').update(update).eq('user_id', body.user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
