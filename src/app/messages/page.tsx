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
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'interests' | 'messages'>('interests')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
      
      // Real-time subscription
      const channel = supabase
        .channel('messages-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        }, () => {
          loadData()
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          loadData()
        })
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

  const loadData = async () => {
    if (!user) return
    
    // Load notifications (interests on user's jobs)
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (notifs) setNotifications(notifs)
    
    // Load conversations
    loadConversations()
  }

  const loadConversations = async () => {
    if (!user) return

    const { data: sentMessages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!sentMessages) {
      setLoading(false)
      return
    }

    const convMap = new Map<string, Conversation>()
    
    for (const msg of sentMessages) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      
      const { data: job } = await supabase.from('jobs').select('title').eq('id', msg.job_id).single()
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

    const sorted = Array.from(convMap.values())
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    
    setConversations(sorted)
    setLoading(false)
  }

  const loadMessages = async (conv: Conversation) => {
    if (!user) return
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(job_id.eq.${conv.job_id},sender_id.eq.${user.id},receiver_id.eq.${conv.other_user_id}),and(job_id.eq.${conv.job_id},sender_id.eq.${conv.other_user_id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setActiveConversation(conv)
    
    if (data) {
      const unread = data.filter(m => m.receiver_id === user.id && !m.read)
      if (unread.length > 0) {
        await supabase.from('messages').update({ read: true }).in('id', unread.map(m => m.id))
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    if (!activeConversation) {
      alert('No conversation selected')
      return
    }
    if (!user) {
      alert('Please sign in again')
      return
    }
    
    setSending(true)
    const messageText = newMessage.trim()
    const jobId = activeConversation.job_id
    const receiverId = activeConversation.other_user_id
    
    try {
      const { error } = await supabase.from('messages').insert({
        job_id: jobId,
        sender_id: user.id,
        receiver_id: receiverId,
        message_text: messageText,
        read: false
      })

      if (error) {
        console.error('Error sending message:', error)
        alert('Failed to send: ' + error.message)
      } else {
        setNewMessage('')
        loadMessages(activeConversation)
        loadConversations()
      }
    } catch (err) {
      console.error('Error:', err)
    }
    
    setSending(false)
  }

  const handleAccept = async (notif: Notification) => {
    // Update interest status to SELECTED
    await supabase
      .from('interests')
      .update({ status: 'SELECTED' })
      .eq('job_id', notif.job_id)
      .eq('user_id', notif.from_user_id)
    
    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'AWARDED', selected_contractor_id: notif.from_user_id })
      .eq('id', notif.job_id)
    
    // Log in history
    await supabase.from('job_history').insert({
      user_id: user.id,
      job_id: notif.job_id,
      action: 'CONTRACTOR_SELECTED'
    })

    // Create initial message to start conversation
    const jobTitle = notif.job_title || 'your project'
    await supabase.from('messages').insert({
      job_id: notif.job_id,
      sender_id: user.id,
      receiver_id: notif.from_user_id,
      message_text: `Hi! I've accepted your interest for "${jobTitle}". Let's discuss the details!`,
      read: false
    })

    // Remove this notification from local state (so it disappears from Interests)
    setNotifications(prev => prev.filter(n => n.id !== notif.id))
    
    // Switch to messages tab first
    setActiveTab('messages')
    
    // Wait a moment then reload conversations
    setTimeout(async () => {
      await loadConversations()
      
      // Also manually add the conversation to show immediately
      const newConv: Conversation = {
        id: `${notif.from_user_id}-${notif.job_id}`,
        job_id: notif.job_id,
        job_title: notif.job_title || 'Project',
        other_user_id: notif.from_user_id,
        other_user_name: notif.from_name || 'User',
        other_user_company: notif.from_company,
        last_message: `Hi! I've accepted your interest for "${jobTitle}". Let's discuss the details!`,
        last_message_at: new Date().toISOString(),
        unread: false
      }
      setConversations(prev => [newConv, ...prev])
    }, 500)
  }

  const handleDecline = async (notif: Notification) => {
    console.log('Decline clicked for:', notif.id, notif.from_name)
    try {
      const { error } = await supabase
        .from('interests')
        .update({ status: 'DECLINED' })
        .eq('job_id', notif.job_id)
        .eq('user_id', notif.from_user_id)
      
      if (error) {
        console.error('Decline error:', error)
        alert('Failed to decline: ' + error.message)
        return
      }
      
      console.log('Decline success, removing from list')
      // Remove from local notifications immediately
      setNotifications(prev => prev.filter(n => n.id !== notif.id))
      loadData()
    } catch (err) {
      console.error('Decline exception:', err)
    }
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
    if (!name) return '?'
    return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || '?'
  }

  const unreadNotifs = (notifications || []).filter(n => !n?.read).length
  const unreadMessages = (conversations || []).filter(c => c?.unread).length

  const myJobNotifications = (notifications || []).filter(n => n?.type === 'interest')

  // If viewing a conversation (mobile)
  if (activeConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-white">
        {/* Chat Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setActiveConversation(null)} className="p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link href={`/jobs/${activeConversation.job_id}`} className="flex-1">
            <div className="font-semibold text-gray-900">
              {activeConversation.other_user_name || 'User'}
              {activeConversation.other_user_company && ` - ${activeConversation.other_user_company}`}
            </div>
            <div className="text-xs text-gray-500">{activeConversation.job_title || 'Job'}</div>
          </Link>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map(msg => (
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
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3 flex gap-2 bg-white">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
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

  // Main Messages List
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('interests')}
          className={`flex-1 py-3 text-center font-semibold text-sm ${
            activeTab === 'interests' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500'
          }`}
        >
          Interests {unreadNotifs > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadNotifs}</span>}
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-3 text-center font-semibold text-sm ${
            activeTab === 'messages' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500'
          }`}
        >
          Messages {unreadMessages > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadMessages}</span>}
        </button>
      </div>

      {/* Interests Tab */}
      {activeTab === 'interests' && (
        <div>
          {myJobNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No interests yet</p>
              <p className="text-gray-400 text-sm mt-1">When contractors express interest, they'll appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myJobNotifications.map(notif => (
                <div key={notif.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getInitials(notif.from_name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{notif.from_name}</p>
                          <p className="text-sm text-gray-500">{notif.from_company}</p>
                        </div>
                        <span className="text-xs text-gray-400">{formatTime(notif.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Interested in: <span className="font-medium">{notif.job_title}</span></p>
                      {notif.message && (
                        <p className="text-sm text-gray-500 mt-2 italic">"{notif.message}"</p>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAccept(notif)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium"
                        >
                          ✓ Accept
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            console.log('Decline button clicked', notif.id)
                            handleDecline(notif)
                          }}
                          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                        >
                          Decline
                        </button>
                        <Link
                          href={`/contractor/${notif.from_user_id}`}
                          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Accept a contractor to start chatting</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv)
                    loadMessages(conv)
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {conv.other_user_photo ? (
                      <img src={conv.other_user_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      getInitials(conv.other_user_name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-gray-900 truncate">{conv.other_user_name}</h3>
                      <span className="text-xs text-gray-500">{formatTime(conv.last_message_at)}</span>
                    </div>
                    {conv.other_user_company && (
                      <p className="text-xs text-gray-500 truncate">{conv.other_user_company}</p>
                    )}
                    <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              ))}
            </div>
          )}
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
