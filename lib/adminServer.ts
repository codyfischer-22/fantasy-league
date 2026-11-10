import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client. The service role key bypasses row-level security,
// so this file must ONLY be imported from API routes (never from a 'use client' page).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export const TIERS = ['stowaway', 'castaway', 'crewchief', 'teamprincipal'] as const

export const LEAGUE_TYPES = [
  'secrets-on-the-beach',
  'sotb-demo',
  'uncharted-turretory',
  'uncharted-turretory-demo',
  'sandbox',
] as const

// Confirms the request comes from a signed-in Global Admin.
// Returns the admin's user id, or null if not allowed.
export async function requireGlobalAdmin(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null

  const { data: userData, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !userData?.user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_global_admin')
    .eq('user_id', userData.user.id)
    .single()

  return profile?.is_global_admin ? userData.user.id : null
}

// Pulls sign-up and last-sign-in dates for every account (paged, 1000 at a time).
export async function listAllAuthUsers() {
  const users: { id: string; created_at: string; last_sign_in_at: string | null }[] = []
  let page = 1
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    users.push(
      ...data.users.map((u) => ({
        id: u.id,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      }))
    )
    if (data.users.length < 1000) break
    page++
  }
  return users
}
