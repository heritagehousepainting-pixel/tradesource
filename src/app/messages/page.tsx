'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Notification {
  id: string
  type: 'interest' | 'message'
  job_id: string
  job_title: string
  from_user_id: string
  from_name: string
  from_company: string
  message: string
  created_at: string
  read: boolean
}

interface Message {
  id: string
  message_text: string
  sender_id: string
  receiver_id: string
  created_at: string
}

interface Conversation {
  job_id: string
  job_title: string
  other_user_id: string
  other_user_name: string
  last_message: string
  last_message_at: string
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    const jobId = searchParams.get('job')
    const otherUserId = searchParams.get('user')
    
    if (jobId && otherUserId && user) {
      setActiveConversation(jobId)
      setActiveTab('messages')
      loadMessages(jobId, otherUserId)
      router.replace('/messages')
    }
  }, [searchParams, user])

  const checkUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        router.push('/signin')
        return
      }
      if (!user) {
        router.push('/signin')
        return
      }
      setUser(user)
      setLoading(false)
    } catch (err) {
      console.error('Check user error:', err)
      setError('Error loading user')
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      await Promise.all([loadNotifications(), loadConversations()])
    } catch (err) {
      console.error('Load data error:', err)
    }
  }

  const loadNotifications = async () => {
    try {
      // Get jobs posted by user
      const { data: myJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('posted_by', user.id)
    
      if (jobsError) {
        console.error('Jobs error:', jobsError)
        setNotifications([])
        return
      }

      if (!myJobs || myJobs.length === 0) {
        setNotifications([])
        return
      }

      const jobIds = myJobs.map(j => j.id)
      const jobMap = myJobs.reduce((acc, j) => ({ ...acc, [j.id]: j.title }), {})

      // Get interests on user's jobs
      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select('*, users(first_name, last_name, company_name)')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })

      if (interestsError) {
        console.error('Interests error:', interestsError)
      }

      if (interestsData) {
        const notifications: Notification[] = interestsData.map(interest => ({
          id: interest.id,
          type: 'interest' as const,
          job_id: interest.job_id,
          job_title: jobMap[interest.job_id] || 'Job',
          from_user_id: interest.user_id,
          from_name: `${interest.users?.first_name || ''} ${interest.users?.last_name || ''}`.trim(),
          from_company: interest.users?.company_name || 'Individual',
          message: interest.message || '',
          created_at: interest.created_at,
          read: false
        }))
        setNotifications(notifications)
      }
    } catch (err) {
      console.error('Load notifications error:', err)
    }
  }

  const loadConversations = async () => {
    try {
      const { data: allMessages } = await supabase
        .from('messages')
        .select('job_id, sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (!allMessages) return

      const uniqueJobs = [...new Set(allMessages.map(m => m.job_id))]
      const convos: Conversation[] = []
      
      for (const jobId of uniqueJobs.slice(0, 10)) {
        const jobMessages = allMessages.filter(m => m.job_id === jobId)
        const lastMsg = jobMessages[0]
        
        const { data: jobData } = await supabase
          .from('jobs')
          .select('title')
          .eq('id', jobId)
          .single()
        
        if (!jobData) continue

        const otherUserId = lastMsg.sender_id === user.id ? lastMsg.receiver_id : lastMsg.sender_id
        
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', otherUserId)
          .single()

        const { data: lastMsgText } = await supabase
          .from('messages')
          .select('message_text')
          .eq('job_id', jobId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        convos.push({
          job_id: jobId,
          job_title: jobData.title,
          other_user_id: otherUserId,
          other_user_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown',
          last_message: lastMsgText?.message_text || '',
          last_message_at: lastMsg.created_at
        })
      }

      convos.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      setConversations(convos)
    } catch (err) {
      console.error('Load conversations error:', err)
    }
  }

  const loadMessages = async (jobId: string, otherUserId: string) => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('job_id', jobId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (msgs) {
      setMessages(msgs)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    const otherUserId = conversations.find(c => c.job_id === activeConversation)?.other_user_id
    if (!otherUserId) return

    setSending(true)

    const { error } = await supabase.from('messages').insert({
      job_id: activeConversation,
      sender_id: user.id,
      receiver_id: otherUserId,
      message_text: newMessage,
    })

    if (!error) {
      setNewMessage('')
      loadMessages(activeConversation, otherUserId)
      loadConversations()
    }

    setSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getNotificationCount = () => notifications.length

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  if (error) {
    return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-1/3 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 p-3 text-center font-medium ${
              activeTab === 'notifications' 
                ? 'border-b-2 border-slate-900 text-slate-900' 
                : 'text-slate-500'
            }`}
          >
            Interests ({getNotificationCount()})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 p-3 text-center font-medium ${
              activeTab === 'messages' 
                ? 'border-b-2 border-slate-900 text-slate-900' 
                : 'text-slate-500'
            }`}
          >
            Chats ({conversations.length})
          </button>
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            {notifications.length === 0 ? (
              <div className="p-4 text-slate-500 text-center">
                No new interests on your jobs.
              </div>
            ) : (
              <div>
                {notifications.map(notif => (
                  <Link
                    key={notif.id}
                    href={`/jobs/${notif.job_id}`}
                    className="block p-4 border-b hover:bg-slate-50"
                  >
                    <div className="font-medium">{notif.from_name}</div>
                    <div className="text-sm text-slate-500">{notif.from_company}</div>
                    <div className="text-xs text-slate-400 mt-1">re: {notif.job_title}</div>
                    {notif.message && (
                      <div className="mt-2 text-sm text-slate-600 italic line-clamp-2">
                        "{notif.message}"
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Link 
                        href={`/contractor/${notif.from_user_id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Profile
                      </Link>
                      <Link 
                        href={`/messages?job=${notif.job_id}&user=${notif.from_user_id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Message
                      </Link>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div>
            {conversations.length === 0 ? (
              <div className="p-4 text-slate-500 text-center">
                No conversations yet.
              </div>
            ) : (
              <div>
                {conversations.map(convo => (
                  <div
                    key={convo.job_id}
                    onClick={() => {
                      setActiveConversation(convo.job_id)
                      loadMessages(convo.job_id, convo.other_user_id)
                    }}
                    className={`p-4 border-b cursor-pointer hover:bg-slate-50 ${
                      activeConversation === convo.job_id ? 'bg-slate-100' : ''
                    }`}
                  >
                    <div className="font-medium">{convo.job_title}</div>
                    <div className="text-sm text-slate-500">{convo.other_user_name}</div>
                    <div className="text-sm text-slate-400 truncate">{convo.last_message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Thread */}
      <div className="w-2/3 flex flex-col">
        {activeConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.sender_id === user.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p>{msg.message_text}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender_id === user.id ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-lg px-3 py-2 resize-none"
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a conversation or interest to view
          </div>
        )}
      </div>
    </div>
  )
}

export default function Messages() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">TradeSource</Link>
        </div>
      </header>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <MessagesContent />
      </Suspense>
    </div>
  )
}
