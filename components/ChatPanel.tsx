'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

type Message = {
  id: string;
  league_id: number;
  user_id: string;
  content: string;
  created_at: string;
};

function renderMessageContent(text: string, members: { user_id: string; display_name: string }[]) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const names = members.map((m) => m.display_name).sort((a, b) => b.length - a.length);
  const mentionRegex = names.length > 0
    ? new RegExp(`(@(?:${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`, 'g')
    : null;

  // Split on URLs first
  const urlParts = text.split(urlRegex);

  return urlParts.map((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
    return (
  <a
    key={`url-${i}`}
    href={part}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: 'rgb(245, 255, 156)',
      textDecoration: 'underline',
      wordBreak: 'break-all',
      overflowWrap: 'break-word'
    }}
  >
    {part}
  </a>
);
    }
    // Within each non-URL chunk, split further on mentions
    if (!mentionRegex) return part;
    const mentionParts = part.split(mentionRegex);
    return mentionParts.map((mentionPart, j) => {
      const isMention = names.some((n) => `@${n}` === mentionPart);
      return isMention ? (
        <span key={`mention-${i}-${j}`} style={{ color: 'rgb(245, 255, 156)', fontWeight: 'bold' }}>
          {mentionPart}
        </span>
      ) : (
        <span key={`text-${i}-${j}`}>{mentionPart}</span>
      );
    });
  });
}

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
const [leagues, setLeagues] = useState<{ id: number; name: string; league_type: string; slug: string }[]>([]);  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());
  const [teamPrincipalUserIds, setTeamPrincipalUserIds] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commonEmojis = ['👍', '👎', '❤️', '😀', '😢', '😡', '😮', '😂', '🙏', '🏆', '🌴', '🏎️', '🚗', '🚀', '💩'];
  const [reactions, setReactions] = useState<Record<string, { emoji: string; user_id: string }[]>>({});
  const reactionEmojis = ['👍', '👎', '❤️', '🎉'];
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [selectedLeagueIsPrivate, setSelectedLeagueIsPrivate] = useState<boolean>(true);
  const [episode1Scored, setEpisode1Scored] = useState<boolean>(false);
  const [leagueUnreadMap, setLeagueUnreadMap] = useState<Record<number, boolean>>({});
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const isPrependingRef = useRef(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCandidates, setMentionCandidates] = useState<{ user_id: string; display_name: string }[]>([]);
  const [leagueMemberList, setLeagueMemberList] = useState<{ user_id: string; display_name: string }[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isNearTop, setIsNearTop] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
const [reportReason, setReportReason] = useState('');
const [reportSubmitting, setReportSubmitting] = useState(false);

useEffect(() => {
  async function loadUnreadPerLeague() {
    if (!user || leagues.length === 0) {
      setLeagueUnreadMap({});
      return;
    }
    const leagueIds = leagues.map((l) => l.id);

    const { data: readRows, error: readError } = await supabase
      .from('chat_read_status')
      .select('league_id, last_read_at')
      .eq('user_id', user.id)
      .in('league_id', leagueIds);
    if (readError) {
      console.error('Error loading read status:', JSON.stringify(readError, null, 2));
      return;
    }
    const readMap: Record<number, string> = {};
    (readRows ?? []).forEach((r) => { readMap[r.league_id] = r.last_read_at; });

    const { data: msgRows, error: msgError } = await supabase
      .from('messages')
      .select('league_id, created_at')
      .in('league_id', leagueIds)
      .order('created_at', { ascending: false });
    if (msgError) {
      console.error('Error loading latest messages:', JSON.stringify(msgError, null, 2));
      return;
    }
    const latestByLeague: Record<number, string> = {};
    (msgRows ?? []).forEach((m) => {
      if (!latestByLeague[m.league_id]) latestByLeague[m.league_id] = m.created_at;
    });

    const unreadMap: Record<number, boolean> = {};
    leagueIds.forEach((id) => {
      const latest = latestByLeague[id];
      if (!latest) {
        unreadMap[id] = false;
        return;
      }
      const lastRead = readMap[id];
      unreadMap[id] = !lastRead || new Date(latest) > new Date(lastRead);
    });
    setLeagueUnreadMap(unreadMap);
  }
  loadUnreadPerLeague();
}, [leagues, user, messages]);

  useEffect(() => {
    async function loadLeagueGateInfo() {
      if (!selectedLeagueId) {
        setSelectedLeagueIsPrivate(true);
        setEpisode1Scored(false);
        return;
      }
      const { data, error } = await supabase
        .from('leagues')
        .select('is_private, league_type')
        .eq('id', selectedLeagueId)
        .single();
      if (error) {
        console.error('Error loading league gate info:', JSON.stringify(error, null, 2));
        return;
      }
      setSelectedLeagueIsPrivate(data?.is_private ?? true);
      if (data && data.is_private === false) {
        const { data: scoreRows, error: scoreError } = await supabase
          .from('episode_scores')
          .select('id')
          .eq('league_type', data.league_type)
          .eq('episode_number', 1)
          .limit(1);
        if (scoreError) {
          console.error('Error checking episode 1 scores:', JSON.stringify(scoreError, null, 2));
          return;
        }
        setEpisode1Scored((scoreRows ?? []).length > 0);
      } else {
        setEpisode1Scored(false);
      }
    }
    loadLeagueGateInfo();
  }, [selectedLeagueId]);

  useEffect(() => {
    async function loadUserTier() {
      if (!user) {
        setUserTier(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('tier')
        .eq('user_id', user.id)
        .single();
      if (error) {
        console.error('Error loading user tier:', JSON.stringify(error, null, 2));
        return;
      }
      setUserTier(data?.tier ?? 'stowaway');
    }
    loadUserTier();
  }, [user]);

  useEffect(() => {
    async function markAsRead() {
      if (!selectedLeagueId || !user) return;
      const { error } = await supabase
        .from('chat_read_status')
        .upsert(
          {
            user_id: user.id,
            league_id: selectedLeagueId,
            last_read_at: new Date().toISOString()
          },
          { onConflict: 'user_id,league_id' }
        );
      if (error) {
        console.error('Error marking chat as read:', JSON.stringify(error, null, 2));
      }
    }
    markAsRead();
  }, [selectedLeagueId, messages, user]);

  useEffect(() => {
    async function loadLeagues() {
      if (!user) return;
      const { data: memberRows, error: memberError } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', user.id);
      if (memberError) {
        console.error('Error loading league memberships:', JSON.stringify(memberError, null, 2));
        return;
      }
      const leagueIds = (memberRows ?? []).map((row) => row.league_id);
      if (leagueIds.length === 0) {
        setLeagues([]);
        return;
      }
      const { data: leagueRows, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name, league_type, slug')
        .in('id', leagueIds)
        .order('id', { ascending: true });
      if (leagueError) {
        console.error('Error loading league details:', JSON.stringify(leagueError, null, 2));
        return;
      }
      const myLeagues = leagueRows ?? [];
      const myLeagueTypes = [...new Set(myLeagues.map((l) => l.league_type))];
let communityChats: { id: number; name: string; league_type: string; slug: string }[] = [];      if (myLeagueTypes.length > 0) {
        const { data: chatRows, error: chatError } = await supabase
          .from('leagues')
          .select('id, name, league_type, slug')
          .eq('is_show_chat', true)
          .in('league_type', myLeagueTypes);
        if (chatError) {
          console.error('Error loading community chats:', JSON.stringify(chatError, null, 2));
        } else {
          communityChats = chatRows ?? [];
        }
      }
      const leagueList = [...communityChats, ...myLeagues];
      setLeagues(leagueList);
      setSelectedLeagueId((current) => current ?? (leagueList.length > 0 ? leagueList[0].id : null));
    }
    loadLeagues();
  }, [user]);

  useEffect(() => {
  async function loadMembersForMentions() {
    if (!selectedLeagueId) {
      setLeagueMemberList([]);
      return;
    }
    const { data: memberRows, error: memberError } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', selectedLeagueId);
    if (memberError) {
      console.error('Error loading members for mentions:', JSON.stringify(memberError, null, 2));
      return;
    }
    const memberIds = (memberRows ?? []).map((m) => m.user_id);
    if (memberIds.length === 0) {
      setLeagueMemberList([]);
      return;
    }
    const { data: profileRows, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', memberIds);
    if (profileError) {
      console.error('Error loading mention profiles:', JSON.stringify(profileError, null, 2));
      return;
    }
    setLeagueMemberList(
      (profileRows ?? []).map((p) => ({ user_id: p.user_id, display_name: p.display_name || 'Unnamed Player' }))
    );
  }
  loadMembersForMentions();
}, [selectedLeagueId]);

  useEffect(() => {
    if (!selectedLeagueId) {
      setMessages([]);
      return;
    }
    async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, league_id, user_id, content, created_at')
    .eq('league_id', selectedLeagueId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error loading messages:', JSON.stringify(error, null, 2));
    return;
  }

  const recent = (data ?? []).reverse();
  setMessages(recent);
  setHasMoreMessages(recent.length === 50);
}
    loadMessages();

    const channel = supabase
      .channel(`messages-league-${selectedLeagueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `league_id=eq.${selectedLeagueId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLeagueId]);

  useEffect(() => {
    if (!selectedLeagueId || messages.length === 0) {
      setReactions({});
      return;
    }
    async function loadReactions() {
      const messageIds = messages.map((m) => m.id);
      const { data, error } = await supabase
        .from('message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', messageIds);
      if (error) {
        console.error('Error loading reactions:', JSON.stringify(error, null, 2));
        return;
      }
      const grouped: Record<string, { emoji: string; user_id: string }[]> = {};
      (data ?? []).forEach((r) => {
        if (!grouped[r.message_id]) grouped[r.message_id] = [];
        grouped[r.message_id].push({ emoji: r.emoji, user_id: r.user_id });
      });
      setReactions(grouped);
    }
    loadReactions();

    const channel = supabase
      .channel(`reactions-league-${selectedLeagueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLeagueId, messages]);

  useEffect(() => {
    async function loadDisplayNames() {
      const userIds = [...new Set(messages.map((m) => m.user_id))];
      if (userIds.length === 0) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, is_global_admin, tier')
        .in('user_id', userIds);
      if (error) {
        console.error('Error loading display names:', JSON.stringify(error, null, 2));
        return;
      }
      const nameMap: Record<string, string> = {};
      const adminIds = new Set<string>();
      const teamPrincipalIds = new Set<string>();
      (data ?? []).forEach((row) => {
        nameMap[row.user_id] = row.display_name;
        if (row.is_global_admin) adminIds.add(row.user_id);
        if (row.tier === 'teamprincipal') teamPrincipalIds.add(row.user_id);
      });
      setDisplayNames((prev) => ({ ...prev, ...nameMap }));
      setAdminUserIds((prev) => new Set([...prev, ...adminIds]));
      setTeamPrincipalUserIds((prev) => new Set([...prev, ...teamPrincipalIds]));
    }
    loadDisplayNames();
  }, [messages]);

useEffect(() => {
  if (isPrependingRef.current) {
    isPrependingRef.current = false;
    return;
  }
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

async function loadOlderMessages() {
  if (!selectedLeagueId || messages.length === 0 || loadingOlder) return;
  setLoadingOlder(true);

  const oldestMessage = messages[0];
  const { data, error } = await supabase
    .from('messages')
    .select('id, league_id, user_id, content, created_at')
    .eq('league_id', selectedLeagueId)
    .lt('created_at', oldestMessage.created_at)
    .order('created_at', { ascending: false })
    .limit(50);

  setLoadingOlder(false);

  if (error) {
    console.error('Error loading older messages:', JSON.stringify(error, null, 2));
    return;
  }

  const olderBatch = (data ?? []).reverse();
  if (olderBatch.length < 50) {
    setHasMoreMessages(false);
  }
  isPrependingRef.current = true;
  setMessages((prev) => [...olderBatch, ...prev]);
}

function handleMessagesScroll() {
  const el = messagesContainerRef.current;
  if (!el) return;
  setIsNearTop(el.scrollTop < 80);
}

async function handleSend() {
  if (!newMessage.trim() || !selectedLeagueId || !user) return;
  const trimmed = newMessage.trim();
  const { error } = await supabase.from('messages').insert({
    league_id: selectedLeagueId,
    user_id: user.id,
    content: trimmed
  });
  if (error) {
    console.error('Error sending message:', JSON.stringify(error, null, 2));
    return;
  }
 const mentionedMembers = leagueMemberList.filter(
  (m) => trimmed.includes(`@${m.display_name}`) && m.user_id !== user.id
);
if (mentionedMembers.length > 0) {
 const senderName = leagueMemberList.find((m) => m.user_id === user.id)?.display_name ?? 'Someone';
const league = leagues.find((l) => l.id === selectedLeagueId);
await supabase.from('notifications').insert(
  mentionedMembers.map((m) => ({
    user_id: m.user_id,
    message: `${senderName} tagged you in the ${league?.name ?? 'a league'} chat!`,
    link: null,
  }))
);
}
  setNewMessage('');
}

async function submitReport(msg: Message) {
  if (!user || !reportReason.trim()) return;
  const currentUserId = user.id;
  setReportSubmitting(true);
  const reporterName = leagueMemberList.find((m) => m.user_id === currentUserId)?.display_name ?? 'Someone';
  const { data: leagueData } = await supabase
    .from('leagues')
    .select('name')
    .eq('id', msg.league_id)
    .single();
  const { data: admins } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('is_global_admin', true);
  const reportedName = displayNames[msg.user_id] ?? 'a Player';
  await supabase.from('notifications').insert(
    (admins ?? []).map((a) => ({
      user_id: a.user_id,
      message: `⚠️ ${reporterName} reported a message from ${reportedName} in ${leagueData?.name ?? 'a league'}. Report: "${reportReason.trim()}"`,
      link: null,
    }))
  );
  setReportSubmitting(false);
  setReportingMessageId(null);
  setReportReason('');
}

async function toggleReaction(messageId: string, emoji: string) {
  if (!user) return;
  const myExistingReaction = (reactions[messageId] ?? []).find(
    (r) => r.user_id === user.id
  );
  if (myExistingReaction && myExistingReaction.emoji === emoji) {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji);
    if (error) console.error('Error removing reaction:', JSON.stringify(error, null, 2));
  } else {
    if (myExistingReaction) {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', myExistingReaction.emoji);
      if (error) console.error('Error removing old reaction:', JSON.stringify(error, null, 2));
    }
    const { error } = await supabase.from('message_reactions').insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    });
    if (error) console.error('Error adding reaction:', JSON.stringify(error, null, 2));
  }
}

  const isStowaway = userTier === 'stowaway';
  const isGatedPublicLeague = isStowaway && !selectedLeagueIsPrivate;
  const chatLocked = isGatedPublicLeague && episode1Scored;
  const readOnly = isGatedPublicLeague && !episode1Scored;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 150,
        left: 0
      }}
    >
<div
  className="mobile-chat-panel"
  onClick={(e) => e.stopPropagation()}
  style={{
    backgroundColor: '#1a1a2e',
    borderLeft: '2.25px solid #f0b429',
    width: '340px',
    maxWidth: '90vw',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    boxSizing: 'border-box'
  }}
>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <select
            value={selectedLeagueId ?? ''}
            onChange={(e) => setSelectedLeagueId(Number(e.target.value))}
            style={{
              backgroundColor: '#12121a',
              color: '#f7af09',
              border: '1px solid #f0b429',
              borderRadius: '6px',
              padding: '6px 30px 6px 8px',
              fontSize: '0.95rem',
              flex: 1,
              marginRight: '16px',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23f0b429'><path d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/></svg>")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '14px'
            }}
          >
          {leagues.map((league) => (
  <option key={league.id} value={league.id}>
    {league.name}{leagueUnreadMap[league.id] ? ' 🔥' : ''}
  </option>
))}
          </select>
         <button
  className="desktop-only-close"
  onClick={onClose}
  style={{
    background: 'none',
    border: 'none',
    color: '#a0a0b0',
    fontSize: '1.2rem',
    cursor: 'pointer'
  }}
>
  ✕
</button>
        </div>

        <div
  ref={messagesContainerRef}
  onScroll={handleMessagesScroll}
  style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}
>
          {chatLocked ? null : leagues.length === 0 ? (
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>You're not in any leagues yet.</p>
          ) : messages.length === 0 ? (
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>No messages yet. Be the first to say hello!</p>
          ) : (
            messages.map((msg) => {
              const isAdminMsg = adminUserIds.has(msg.user_id);
              const isTeamPrincipalMsg = teamPrincipalUserIds.has(msg.user_id);
              const specialColor = isAdminMsg ? '#ff6b6b' : isTeamPrincipalMsg ? '#ca29ca' : null;
              return (
                <div key={msg.id} style={{ marginBottom: '8px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  <span style={{ color: '#f0b429', fontWeight: 'normal' }}>
                    {msg.user_id === user?.id ? 'Me' : (displayNames[msg.user_id] ?? '...')}:
                  </span>
                  {' '}
   <span style={{
  color: specialColor ?? (msg.user_id === user?.id ? '#ffffff' : '#a0a0b0'),
  fontWeight: isAdminMsg ? 'bold' : 'normal'
}}>
  {renderMessageContent(msg.content, leagueMemberList)}
</span>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                    {reactionEmojis.map((emoji) => {
                      const emojiReactions = (reactions[msg.id] ?? []).filter((r) => r.emoji === emoji);
                      const iReacted = emojiReactions.some((r) => r.user_id === user?.id);
                      if (emojiReactions.length === 0 && !iReacted) {
                        return null;
                      }
                      return (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          style={{
                            background: iReacted ? 'rgba(240,180,41,0.2)' : 'transparent',
                            border: '1px solid #333350',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            padding: '1px 6px',
                            cursor: 'pointer',
                            color: '#e0e0e8'
                          }}
                        >
                          {emoji} {emojiReactions.length}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setActiveReactionPicker
                      (activeReactionPicker === msg.id ? null : msg.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #333350',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        padding: '1px 6px',
                        cursor: 'pointer',
                        color: '#555570'
                      }}
                    >
                      +
                    </button>
                  </div>
                {activeReactionPicker === msg.id && (
  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', alignItems: 'center' }}>
    {reactionEmojis.map((emoji) => (
      <button
        key={emoji}
        onClick={() => {
          toggleReaction(msg.id, emoji);
          setActiveReactionPicker(null);
        }}
        style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
      >
        {emoji}
      </button>
    ))}
    {msg.user_id !== user?.id && (
      <button
        onClick={() => {
          setReportingMessageId(msg.id);
          setActiveReactionPicker(null);
        }}
        style={{
          background: 'none',
          border: '1px solid #333350',
          borderRadius: '10px',
          fontSize: '0.7rem',
          padding: '2px 8px',
          cursor: 'pointer',
          color: '#a0a0b0'
        }}
      >
        🚩 Report
      </button>
    )}
  </div>
)}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

       {hasMoreMessages && messages.length > 0 && !chatLocked && isNearTop && (
  <button
    onClick={loadOlderMessages}
    disabled={loadingOlder}
    style={{
      display: 'block',
      margin: '0 auto 12px auto',
      background: 'none',
      border: '1px solid #333350',
      borderRadius: '6px',
      color: '#a0a0b0',
      fontSize: '0.75rem',
      padding: '4px 12px',
      cursor: loadingOlder ? 'not-allowed' : 'pointer'
    }}
  >
    {loadingOlder ? 'Loading...' : '↑ Load More'}
  </button>
)}

        {chatLocked ? (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            color: '#a0a0b0',
            fontSize: '0.85rem',
            border: '1px solid #333350',
            borderRadius: '8px'
          }}>
            🔒 Your trial period has ended. Upgrade to Castaway+ to follow and chime in on community buzz!
            <br />
            <a href="/account" style={{ color: '#f0b429', fontWeight: 'bold' }}>Upgrade now →</a>
          </div>
        ) : selectedLeagueId && (
          <div style={{ position: 'relative' }}>
            {!readOnly && showEmojiPicker && (
              <div style={{
                position: 'absolute',
                bottom: '48px',
                left: 0,
                backgroundColor: '#1a1a2e',
                border: '1px solid #f0b429',
                borderRadius: '8px',
                padding: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '4px',
                zIndex: 50
              }}>
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.3rem',
                      cursor: 'pointer',
                      padding: '4px',
                      flexShrink: 0
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            {readOnly ? (
              <p style={{ textAlign: 'center', color: '#555570', fontSize: '0.75rem', margin: 0 }}>
                We are gifting read-only chat access until Episode 1 scores drop. To participate or continue viewing after Week 1, please upgrade to Castaway+!
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                     background: 'none',
    border: '1px solid #333350',
    borderRadius: '6px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0 8px',
    flexShrink: 0
                  }}
                >
                  😎
                </button>
              <input
  value={newMessage}
  onChange={(e) => {
    const value = e.target.value;
    setNewMessage(value);
    const cursorPos = e.target.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_ ]*)$/);
    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      setMentionQuery(query);
      setMentionCandidates(
        leagueMemberList.filter((m) => m.display_name.toLowerCase().includes(query)).slice(0, 5)
      );
      setShowMentionPicker(true);
    } else {
      setShowMentionPicker(false);
    }
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !showMentionPicker) handleSend();
  }}
  placeholder="Type a message..."
  style={{
    flex: '0 1 200px',
    minWidth: 0,
    backgroundColor: '#12121a',
    color: '#e0e0e8',
    border: '1px solid #333350',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '0.9rem'
  }}
/>
{showMentionPicker && mentionCandidates.length > 0 && (
  <div style={{
    position: 'absolute',
    bottom: '48px',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    border: '1px solid #f0b429',
    borderRadius: '8px',
    padding: '4px',
    zIndex: 60
  }}>
    {mentionCandidates.map((m) => (
      <button
        key={m.user_id}
        onClick={() => {
          const cursorPos = newMessage.length;
          const textBeforeCursor = newMessage.slice(0, cursorPos);
          const newText = textBeforeCursor.replace(/@([a-zA-Z0-9_ ]*)$/, `@${m.display_name} `);
          setNewMessage(newText);
          setShowMentionPicker(false);
        }}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          color: '#f0b429',
          padding: '6px 10px',
          fontSize: '0.85rem',
          cursor: 'pointer'
        }}
      >
        @{m.display_name}
      </button>
    ))}
  </div>
)}
                <button
  onClick={handleSend}
  style={{
    backgroundColor: '#f0b429',
    color: '#0a0a0f',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap'
  }}
>
  Send
</button>
              </div>
            )}
          </div>
        )}
      </div>
{reportingMessageId && (
  <div
    onClick={() => setReportingMessageId(null)}
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
        padding: '16px',
        maxWidth: '340px',
        width: '90%'
      }}
    >
      <p style={{ color: '#f0b429', fontSize: '0.85rem', marginBottom: '12px' }}>
        Let our team know why you are reporting this message. This will send a notification for review.
      </p>
      <textarea
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
        placeholder="What's the issue?"
        maxLength={300}
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '8px 10px',
          borderRadius: '6px',
          border: '1px solid #2a2a3e',
          backgroundColor: '#12121a',
          color: '#ffffff',
          fontSize: '0.9rem',
          marginBottom: '12px',
          fontFamily: 'inherit'
        }}
      />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => { setReportingMessageId(null); setReportReason(''); }}
          style={{ background: 'none', border: '1px solid #2a2a3e', color: '#a0a0b0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const msg = messages.find((m) => m.id === reportingMessageId);
            if (msg) submitReport(msg);
          }}
          disabled={reportSubmitting || !reportReason.trim()}
          style={{ background: '#ff6b6b', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: reportSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {reportSubmitting ? 'Sending...' : 'Submit Report'}
        </button>
      </div>
          </div>
      </div>
    )}
    </div>
  );
}