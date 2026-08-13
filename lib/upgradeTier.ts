import { supabase } from './supabase'

export async function upgradeTier(userId: string, newTier: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ tier: newTier })
    .eq('user_id', userId)

  return { error }
}