'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { upgradeTier } from '@/lib/upgradeTier'
import { Suspense } from 'react'
import { containsEmoji } from '@/lib/validation'
import ConfirmModal from '@/components/ConfirmModal'
import { UserPen } from 'lucide-react'

type Profile = {
  email: string
  tier: string
  display_name: string | null
  is_global_admin: boolean
  email_opt_in: boolean
  chat_digest_opt_in: boolean
}

function AccountContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const searchParams = useSearchParams()
  const highlightTier = searchParams.get('tier')
  const [cancelMessage, setCancelMessage] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [emailOptIn, setEmailOptIn] = useState(true)
  const [emailOptInSaving, setEmailOptInSaving] = useState(false)

  const [chatDigestOptIn, setChatDigestOptIn] = useState(false);
const [chatDigestSaving, setChatDigestSaving] = useState(false);

const handleToggleChatDigest = async (checked: boolean) => {
  if (!user) return;
  setChatDigestOptIn(checked);
  setChatDigestSaving(true);
  const { error } = await supabase
    .from('profiles')
    .update({ chat_digest_opt_in: checked })
    .eq('user_id', user.id);
  setChatDigestSaving(false);
  if (error) {
    console.error('Error updating chat digest opt-in:', error);
    setChatDigestOptIn(!checked);
  } else {
    setProfile((prev) => prev ? { ...prev, chat_digest_opt_in: checked } : prev);
  }
};

const handleToggleEmailOptIn = async (checked: boolean) => {
  if (!user) return
  setEmailOptIn(checked)
  setEmailOptInSaving(true)
  const { error } = await supabase
    .from('profiles')
    .update({ email_opt_in: checked })
    .eq('user_id', user.id)
  setEmailOptInSaving(false)
  if (error) {
    console.error('Error updating email opt-in:', error)
    setEmailOptIn(!checked) // revert on failure
  } else {
    setProfile((prev) => prev ? { ...prev, email_opt_in: checked } : prev)
  }
}

  const handleChangePassword = async () => {
    setPasswordMessage('')
    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match.')
      return
    }
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) {
      setPasswordMessage(error.message)
    } else {
      setPasswordMessage('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

const handleSignOut = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

  const handleStripeCheckout = async (tier: string) => {
    if (!user) return
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, userId: user.id, email: user.email }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Something went wrong starting checkout. Please try again.')
    }
  }

  const handleCancelSubscription = async () => {
    if (!user) return
    setUpgrading('stowaway')
    setCancelMessage('')
    const res = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    const data = await res.json()
    setUpgrading(null)
    if (data.success) {
      setCancelMessage(`Your subscription will end and automatically downgrade to the free tier on ${data.periodEnd}. You\u2019ll keep your current access until then.`)
    } else {
      setCancelMessage(data.error || 'Something went wrong. Please try again.')
    }
  }

const handleUpgrade = async (tier: string) => {
  if (!user) return
  setUpgrading(tier)
  const { error } = await upgradeTier(user.id, tier)
  setUpgrading(null)

  if (!error) {
    setProfile((prev) => prev ? { ...prev, tier } : prev)

    if (tier === 'stowaway' || tier === 'castaway') {
      const { data: hostedLeagues } = await supabase
        .from('leagues')
        .select('id, name, league_type, slug')
        .eq('host_user_id', user.id)
        .eq('is_private', true)
        .eq('is_frozen', false)

      if (hostedLeagues && hostedLeagues.length > 0) {
        const leagueIds = hostedLeagues.map((l) => l.id)

        await supabase
          .from('leagues')
          .update({ is_frozen: true })
          .in('id', leagueIds)

        for (const league of hostedLeagues) {
          const { data: members } = await supabase
            .from('league_members')
            .select('user_id')
            .eq('league_id', league.id)

          if (members && members.length > 0) {
            await supabase.from('notifications').insert(
              members.map((m) => ({
                user_id: m.user_id,
                message: `🚩 ${league.name} has been sent to the pit lane as the host's membership dropped below Crew Chief. Racing will resume if they re-upgrade.`,
                link: `/leagues/${league.league_type}/${league.slug}`,
              }))
            )

            const memberIds = members.map((m) => m.user_id)
            const { data: profiles } = await supabase
              .from('profiles')
              .select('email, display_name, email_opt_in')
              .in('user_id', memberIds)
              .eq('email_opt_in', true)

            if (profiles && profiles.length > 0) {
              await fetch('/api/send-notification-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipients: profiles.map((p) => ({
                    email: p.email,
                    playerName: p.display_name || 'Player',
                  })),
                  subject: `${league.name} is in the pit lane...`,
                  message: `Your private league, ${league.name}, has been sent to the pit lane as the host's membership dropped below Crew Chief. Racing will resume once they re-upgrade.`,
                  linkUrl: `https://trekkonleagues.com/leagues/${league.league_type}/${league.slug}`,
                  linkText: 'View League →',
                }),
              })
            }
          }
        }
      }
    }

    if (tier === 'crewchief' || tier === 'teamprincipal') {
      const { data: hostedFrozenLeagues } = await supabase
        .from('leagues')
        .select('id, name, league_type, slug')
        .eq('host_user_id', user.id)
        .eq('is_private', true)
        .eq('is_frozen', true)

      if (hostedFrozenLeagues && hostedFrozenLeagues.length > 0) {
        const leagueIds = hostedFrozenLeagues.map((l) => l.id)

        await supabase
          .from('leagues')
          .update({ is_frozen: false })
          .in('id', leagueIds)

        for (const league of hostedFrozenLeagues) {
          const { data: members } = await supabase
            .from('league_members')
            .select('user_id')
            .eq('league_id', league.id)

          if (members && members.length > 0) {
            await supabase.from('notifications').insert(
              members.map((m) => ({
                user_id: m.user_id,
                message: `🚗 ${league.name} is back out onto the track! The host is back to full activity.`,
                link: `/leagues/${league.league_type}/${league.slug}`,
              }))
            )

            const memberIds = members.map((m) => m.user_id)
            const { data: profiles } = await supabase
              .from('profiles')
              .select('email, display_name, email_opt_in')
              .in('user_id', memberIds)
              .eq('email_opt_in', true)

            if (profiles && profiles.length > 0) {
              await fetch('/api/send-notification-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipients: profiles.map((p) => ({
                    email: p.email,
                    playerName: p.display_name || 'Player',
                  })),
                  subject: `${league.name} is back on track!`,
                  message: `Your league, ${league.name}, is back out onto the track! The host is back to full activity.`,
                  linkUrl: `https://trekkonleagues.com/leagues/${league.league_type}/${league.slug}`,
                  linkText: 'View League →',
                }),
              })
            }
          }
        }
      }
    }
  } else {
    console.error('Upgrade error:', error)
  }
}
    

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user) {
   supabase
  .from('profiles')
  .select('email, tier, display_name, is_global_admin, email_opt_in, chat_digest_opt_in')
  .eq('user_id', user.id)
  .single()
  .then(({ data, error }) => {
    if (error) {
      console.error('Profile fetch error:', JSON.stringify(error, null, 2))
    }
    if (!error) {
      setProfile(data)
      setNameInput(data.display_name ?? '')
      setIsGlobalAdmin(data.is_global_admin ?? false)
      setEmailOptIn(data.email_opt_in ?? true)
      setChatDigestOptIn(data.chat_digest_opt_in ?? false)
    }
    setProfileLoading(false)
  })
    }
  }, [user, loading, router])




const handleSave = async () => {
  if (!user) return
  if (containsEmoji(nameInput)) {
    setSaveMessage('Display name cannot contain emojis.')
    return
  }
  setSaving(true)

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: nameInput })
    .eq('user_id', user.id)

  setSaving(false)

  if (error) {
    if (error.code === '23505') {
      setSaveMessage('That display name is already taken. Please choose another.')
    } else {
      setSaveMessage('Something went wrong. Please try again.')
      console.error('Update error:', error)
    }
  } else {
    setProfile((prev) => prev ? { ...prev, display_name: nameInput } : prev)
    setEditing(false)
    setSaveMessage('Saved!')
  }
}




  if (loading || profileLoading) {
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

  if (!profile) {
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
        Could not load your profile.
      </main>
    )
  }

  const tierLabels: Record<string, string> = {
    stowaway: 'Stowaway',
    castaway: 'Castaway',
    crewchief: 'Crew Chief',
    teamprincipal: 'Team Principal',
  }

  return (
    <main style={{
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      padding: '60px 40px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        backgroundColor: '#1a1a2e',
        border: '1px solid #f0b429',
        borderRadius: '12px',
        padding: '40px'
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none',
          border: 'none',
          color: '#a0a0b0',
          fontSize: '0.85rem',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '16px',
          fontFamily: 'inherit'
        }}>
          ← Back to Previous Page
        </button>
        <h1 style={{ color: '#f0b429', fontSize: '2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <UserPen size={30} strokeWidth={2} style={{ position: 'relative', top: '0px' }} /> My Account
</h1>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}>Email</div>
          <div style={{ fontSize: '1.1rem' }}>{profile.email}</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}>Current Tier</div>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#12121a',
            color: '#f0b429',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '0.95rem'
          }}>
            {tierLabels[profile.tier] ?? profile.tier}
          </div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '8px' }}>Change Tier</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
  {['stowaway', 'castaway', 'crewchief', 'teamprincipal'].map((t) => (
    <button
      key={t}
      className={profile.tier === t ? 'solid-btn' : 'outline-btn'}
      onClick={() => {
        if (isGlobalAdmin) {
          handleUpgrade(t)
        } else if (t === 'stowaway') {
          setShowCancelConfirm(true)
        } else {
          handleStripeCheckout(t)
        }
      }}
      disabled={upgrading !== null || profile.tier === t}
      style={{
        backgroundColor: profile.tier === t ? '#f0b429' : 'transparent',
        color: profile.tier === t ? '#0a0a0f' : '#f0b429',
        border: '1px solid #f0b429',
        padding: '8px 14px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        cursor: profile.tier === t ? 'default' : 'pointer',
        opacity: upgrading !== null && upgrading !== t ? 0.5 : 1,
        boxShadow: highlightTier === t ? '0 0 0 3px rgba(240, 180, 41, 0.5)' : 'none'
      }}
    >
      {upgrading === t ? '...' : (tierLabels[t] ?? t)}
    </button>
  ))}
</div>
          {cancelMessage && (
            <div style={{ color: '#a0a0b0', fontSize: '0.8rem', marginTop: '8px' }}>
              {cancelMessage}
            </div>
          )}
        </div>
        <div>
{editing ? (
<div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
  <input
    type="text"
    value={nameInput}
    onChange={(e) => setNameInput(e.target.value)}
    maxLength={32}
    style={{
      flex: '1 1 100%',
      minWidth: 0,
      padding: '8px 10px',
      borderRadius: '6px',
      border: '1px solid #2a2a3e',
      backgroundColor: '#12121a',
      color: '#ffffff',
      fontSize: '1rem'
    }}
  />
  <button
    className="solid-btn"
    onClick={handleSave}
    disabled={saving}
    style={{
      backgroundColor: '#f0b429',
      color: '#0a0a0f',
      padding: '8px 14px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: 'bold',
      cursor: saving ? 'not-allowed' : 'pointer'
    }}
  >
    {saving ? '...' : 'Save'}
  </button>
  <button
    onClick={() => {
      setEditing(false)
      setNameInput(profile.display_name ?? '')
    }}
    style={{
      backgroundColor: 'transparent',
      color: '#f0b429',
      border: '1px solid #f0b429',
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      cursor: 'pointer'
    }}
  >
    Cancel
  </button>
</div>
          ) : (
   
          <div>
 <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
  <div style={{ fontSize: '1.1rem' }}>{profile.display_name || 'Not set'}</div>
  <button
  onClick={() => setEditing(true)}
  style={{
    backgroundColor: 'transparent',
    color: '#f0b429',
    border: '1px solid #f0b429',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer'
  }}
>
  Change Name
</button>
<button
  onClick={() => setShowPasswordFields(!showPasswordFields)}
  style={{
    backgroundColor: 'transparent',
    color: '#f0b429',
    border: '1px solid #f0b429',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer'
  }}
>
  {showPasswordFields ? 'Cancel' : 'Change Password'}
</button>
  </div>

  {showPasswordFields && (
    <div style={{ marginTop: '12px', textAlign: 'left' }}>

                  <input
                    type="Password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      marginBottom: '8px',
                      borderRadius: '6px',
                      border: '1px solid #2a2a3e',
                      backgroundColor: '#12121a',
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      marginBottom: '10px',
                      borderRadius: '6px',
                       border: '1px solid #2a2a3e',
                      backgroundColor: '#12121a',
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    className="outline-btn"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    style={{
                      backgroundColor: '#f0b429',
                      color: '#0a0a0f',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      cursor: changingPassword ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}

              {passwordMessage && (
                <div style={{ color: '#a0a0b0', fontSize: '0.8rem', marginTop: '8px' }}>
                  {passwordMessage}
                </div>
              )}
            </div>
          )}
          {saveMessage && (
            <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginTop: '8px' }}>
              {saveMessage}
            </div>
          )}
        </div>

        <label style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  marginTop: '24px',
  cursor: 'pointer'
}}>
  <input
    type="checkbox"
    checked={emailOptIn}
    onChange={(e) => handleToggleEmailOptIn(e.target.checked)}
    disabled={emailOptInSaving}
    style={{ marginTop: '3px' }}
  />
  <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
Email me with league notifications and deadlines, new seasons, and website developments.
</span>
</label>

<label style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  marginTop: '8px',
  cursor: 'pointer'
}}>
  <input
    type="checkbox"
    checked={chatDigestOptIn}
    onChange={(e) => handleToggleChatDigest(e.target.checked)}
    disabled={chatDigestSaving}
    style={{ marginTop: '3px' }}
  />
  <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
    Email me with weekly updates on community and league chats. </span>
</label>

        <button
  onClick={handleSignOut}
  style={{
    marginTop: '24px',
    width: '100%',
    backgroundColor: 'transparent',
    color: '#ff6b6b',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ff6b6b',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer'
  }}
>
  Sign Out
</button>

<ConfirmModal
  open={showCancelConfirm}
  title="Downgrade to Stowaway?"
  message="Are you sure you want to downgrade? Doing so will cause you to lose membership perks at the end of your paid period. Your current membership tier will remain active until then."
  confirmText="Downgrade"
  danger
  onConfirm={() => { setShowCancelConfirm(false); handleCancelSubscription() }}
  onCancel={() => setShowCancelConfirm(false)}
/>

      </div>
    </main>
  )
}

export default function Account() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: '#0a0a0f', minHeight: '100vh' }} />}>
      <AccountContent />
    </Suspense>
  )
}