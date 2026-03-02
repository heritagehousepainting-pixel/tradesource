'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

interface Notification {
  id: string
  type: 'interest' | 'message' | 'my_response'
  job_id: string
  job_title: string
  from_user_id: string
  from_name: string
  from_company: string
  message: string
  created_at: string
  read: boolean
}

interface Conversation {
  id: string
  job_id: string
  job_title: string
  other_user_id: string
  other_user_name: string
  other_user_company?: string
  other_user_photo?: string
  last_message: string
  last_message_at: string
  unread: boolean
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadConversations()
      
      // Real-time subscription
      const channel = supabase
        .channel('messages-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        }, () => loadConversations())
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [user])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/signin')
      return
    }
    setUser(user)
  }

  const loadConversations = async () => {
    if (!user) return

    // Get all unique conversations
    const { data: sentMessages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!sentMessages) {
      setLoading(false)
      return
    }

    // Group by conversation partner + job
    const convMap = new Map<string, Conversation>()
    
    for (const msg of sentMessages) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      
      // Get job info
      const { data: job } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', msg.job_id)
        .single()
      
      // Get other user info
      const { data: otherUser } = await supabase
        .from('users')
        .select('first_name, last_name, company_name, profile_photo_url')
        .eq('id', otherId)
        .single()
      
      const key = `${otherId}-${msg.job_id}`
      if (!convMap.has(key) || new Date(msg.created_at) > new Date(convMap.get(key)!.last_message_at)) {
        convMap.set(key, {
          id: key,
          job_id: msg.job_id,
          job_title: job?.title || 'Job',
          other_user_id: otherId,
          other_user_name: otherUser ? `${otherUser.first_name} ${otherUser.last_name}`.trim() : 'User',
          other_user_company: otherUser?.company_name,
          other_user_photo: otherUser?.profile_photo_url,
          last_message: msg.message_text,
          last_message_at: msg.created_at,
          unread: msg.receiver_id === user.id && !msg.read
        })
      }
    }

    // Sort by last message time
    const sorted = Array.from(convMap.values())
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    
    setConversations(sorted)
    setLoading(false)
  }

  const loadMessages = async (conv: Conversation) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(job_id.eq.${conv.job_id},sender_id.eq.${user.id},receiver_id.eq.${conv.other_user_id}),and(job_id.eq.${conv.job_id},sender_id.eq.${conv.other_user_id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    setMessages(data || [])
    
    // Mark as read
    if (data) {
      const unread = data.filter(m => m.receiver_id === user.id && !m.read)
      if (unread.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unread.map(m => m.id))
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return
    
    setSending(true)
    
    const { error } = await supabase
      .from('messages')
      .insert({
        job_id: activeConversation.job_id,
        sender_id: user.id,
        receiver_id: activeConversation.other_user_id,
        message_text: newMessage.trim(),
        read: false
      })

    if (!error) {
      setNewMessage('')
      loadMessages(activeConversation)
      loadConversations()
    }
    
    setSending(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const filteredConversations = conversations.filter(c => 
    c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If viewing a conversation (mobile)
  if (activeConversation) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Chat Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setActiveConversation(null)} className="p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link href={`/jobs/${activeConversation.job_id}`} className="flex-1">
            <div className="font-semibold text-gray-900">{activeConversation.other_user_name}</div>
            <div className="text-xs text-gray-500">{activeConversation.job_title}</div>
          </Link>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                msg.sender_id === user.id 
                  ? 'bg-blue-600 text-white rounded-br-md' 
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              }`}>
                <p className="text-sm">{msg.message_text}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Message..."
            className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Main Messages List (Facebook Marketplace style)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        
        {/* Search */}
        <div className="mt-3 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-gray-100 border-0 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No messages yet</p>
          <p className="text-gray-400 text-sm mt-1">Start a conversation by expressing interest on a job</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => {
                setActiveConversation(conv)
                loadMessages(conv)
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {conv.other_user_photo ? (
                  <img src={conv.other_user_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  getInitials(conv.other_user_name)
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-900 truncate">{conv.other_user_name}</h3>
                  <span className="text-xs text-gray-500">{formatTime(conv.last_message_at)}</span>
                </div>
                {conv.other_user_company && (
                  <p className="text-xs text-gray-500 truncate">{conv.other_user_company}</p>
                )}
                <p className="text-sm text-gray-600 truncate mt-0.5">{conv.last_message}</p>
                <p className="text-xs text-blue-600 mt">re: {conv.job_title}-0.5</p>
              </div>

              {/* Unread indicator */}
              {conv.unread && (
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
        <MessagesContent />
      </Suspense>
      <BottomNav />
    </div>
  )
}
