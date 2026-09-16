'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Mail, Calculator, Users, Trophy, Shield,
  MessageSquareWarning, Activity, Archive, Settings, Lock
} from 'lucide-react'

type CardDef = {
  label: string
  description: string
  icon: any
  href: string | null
  status: 'live' | 'planned'
  globalOnly: boolean
}

const sections: CardDef[] = [
  {
    label: 'Message Players',
    description: 'Send custom in-app notifications and/or emails to any group of players.',
    icon: Mail,
    href: '/admin/message-players',
    status: 'live',
    globalOnly: true,
  },
  {
    label: 'Episode Scoring',
    description: 'Enter episode-by-episode scoring events across every league type.',
    icon: Calculator,
    href: '/admin/scoring',
    status: 'live',
    globalOnly: false,
  },
  {
    label: 'Player / Account Management',
    description: 'Search, view, and edit player accounts. Toggle tiers, admin scope, and more.',
    icon: Users,
    href: null,
    status: 'planned',
    globalOnly: true,
  },
  {
    label: 'League & Season Management',
    description: 'Create, edit, and archive leagues across all league types.',
    icon: Trophy,
    href: null,
    status: 'planned',
    globalOnly: true,
  },
  {
    label: 'Private League Oversight',
    description: 'View and moderate all privately-hosted leagues in one place.',
    icon: Shield,
    href: null,
    status: 'planned',
    globalOnly: true,
  },
  {
    label: 'Reported Messages',
    description: 'See all chat messages reported by players.',
    icon: MessageSquareWarning,
    href: null,
    status: 'planned',
    globalOnly: true,
  },
  {
    label: 'Site Health',
    description: 'Basic statistics and monitoring: player counts, active leagues, error logs, etc.',
    icon: Activity,
    href: null,
    status: 'planned',
    globalOnly: true,
  },
  {
    label: 'League Archive',
    description: 'Browse and preserve past completed leagues and seasons.',
    icon: Archive,
    href: null,
    status: 'planned',
    globalOnly: true,
  },
  {
    label: 'Contact / Support',
    description: 'View messages submitted through the site\u2019s contact form.',
    icon: Settings,
    href: null,
    status: 'planned',
    globalOnly: true,
  },
]

export default function AdminDashboardPage() {
  const { user, loading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setChecking(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_global_admin, is_league_admin')
        .eq('user_id', user.id)
        .single()

      setIsGlobalAdmin(profile?.is_global_admin ?? false)
      setHasAccess((profile?.is_global_admin || profile?.is_league_admin) ?? false)
      setChecking(false)
    }
    if (!loading) checkAdmin()
  }, [user, loading])

  if (loading || checking) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        Loading...
      </main>
    )
  }

  if (!user || !hasAccess) {
    return (
      <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontFamily: 'Georgia, serif' }}>
        <p>Access denied.</p>
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#ffffff', padding: '60px 40px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={32} strokeWidth={2} color="#f0b429" />
          <span style={{ color: '#f0b429' }}>{isGlobalAdmin ? 'Global Admin' : 'League Admin'}</span>{' '}
          <span style={{ color: '#ffffff' }}>Dashboard</span>
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '36px' }}>
          {isGlobalAdmin
            ? 'Central hub for managing Trekkon Fantasy Leagues. Sections marked "Coming Soon" are scaffolded for future build-out.'
            : 'You have League Admin access to the sections below marked "Available." Everything else is reserved for Global Admins.'}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {sections.map((section) => {
            const Icon = section.icon
            const isClickable = section.status === 'live' && section.href && (isGlobalAdmin || !section.globalOnly)
            const isLockedForRole = !isGlobalAdmin && section.globalOnly

            let badgeLabel = 'Coming Soon'
            let badgeColor = '#555570'
            let badgeBg = 'rgba(85,85,112,0.2)'
            if (isClickable) {
              badgeLabel = 'Available'
              badgeColor = '#f0b429'
              badgeBg = 'rgba(240,180,41,0.15)'
            } else if (isLockedForRole && section.status === 'live') {
              badgeLabel = 'Global Admin Only'
              badgeColor = '#ff6b6b'
              badgeBg = 'rgba(255,107,107,0.12)'
            }

            const cardContent = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  {isLockedForRole ? (
                    <Lock size={26} strokeWidth={1.75} color="#555570" />
                  ) : (
                    <Icon size={28} strokeWidth={1.75} color={isClickable ? '#f0b429' : '#555570'} />
                  )}
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    whiteSpace: 'nowrap',
                  }}>
                    {badgeLabel}
                  </span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '6px', color: isClickable ? '#ffffff' : '#a0a0b0' }}>
                  {section.label}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#7a7a90', lineHeight: '1.5' }}>
                  {section.description}
                </div>
              </>
            )

            const cardStyle = {
              backgroundColor: '#1a1a2e',
              border: isClickable ? '1px solid #f0b429' : '1px solid #2a2a3e',
              borderRadius: '12px',
              padding: '20px',
              textDecoration: 'none',
              display: 'block',
              cursor: isClickable ? 'pointer' : 'not-allowed',
              opacity: isClickable ? 1 : 0.7,
            }

            return isClickable ? (
              <a key={section.label} href={section.href!} className="subpage-card" style={cardStyle}>
                {cardContent}
              </a>
            ) : (
              <div key={section.label} style={cardStyle}>
                {cardContent}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}