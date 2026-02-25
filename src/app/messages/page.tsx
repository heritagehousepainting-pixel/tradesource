'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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
  status?: string
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
  const [activeTab, setActiveTab] = useState<'interests' | 'accepted' | 'declined' | 'applications' | 'chats'>('interests')
  const [showAcceptSuccess, setShowAcceptSuccess] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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
      setCurrentJobId(jobId)
      setCurrentUserId(otherUserId)
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
        return
      }

      // Get interests on user's jobs (as a poster)
      let notifications: Notification[] = []
      
      if (myJobs && myJobs.length > 0) {
        const jobIds = myJobs.map(j => j.id)
        const jobMap: Record<string, string> = {}
        myJobs.forEach(j => {
          jobMap[j.id] = j.title
        })

        const { data: interestsData } = await supabase
          .from('interests')
          .select('*, users(first_name, last_name, company_name)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })

        if (interestsData) {
          notifications = interestsData.map(interest => ({
            id: interest.id,
            type: 'interest' as const,
            job_id: interest.job_id,
            job_title: jobMap[interest.job_id] || 'Job',
            from_user_id: interest.user_id,
            from_name: `${interest.users?.first_name || ''} ${interest.users?.last_name || ''}`.trim(),
            from_company: interest.users?.company_name || 'Individual',
            message: interest.message || '',
            created_at: interest.created_at,
            read: false,
            status: interest.status || 'INTERESTED'
          }))
        }
      }

      // Get notifications where user was interested and got accepted/declined (ONLY if user is the sub, not the poster)
      const { data: myInterests } = await supabase
        .from('interests')
        .select('*, jobs(title, posted_by)')
        .eq('user_id', user.id)  // User is the sub who applied
        .in('status', ['SELECTED', 'DECLINED'])
        .order('created_at', { ascending: false })

      if (myInterests && myInterests.length > 0) {
        const myNotifications: Notification[] = myInterests.map(interest => ({
          id: interest.id,
          type: 'my_response' as const,
          job_id: interest.job_id,
          job_title: interest.jobs?.[0]?.title || 'Job',
          from_user_id: interest.posted_by,
          from_name: interest.status === 'SELECTED' ? '✓ You were accepted!' : '✗ You were declined',
          from_company: interest.status === 'SELECTED' ? 'Start chatting now' : 'Job not awarded',
          message: '',
          created_at: interest.created_at,
          read: false,
          status: interest.status
        }))
        notifications = [...notifications, ...myNotifications]
      }

      setNotifications(notifications)
    } catch (err) {
      console.error('Load notifications error:', err)
    }
  }

  const loadConversations = async () => {
    try {
      // Get all messages where user is sender or receiver
      const { data: allMessages } = await supabase
        .from('messages')
        .select('job_id, sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      // Also get jobs where user was accepted (SELECTED)
      const { data: acceptedJobs } = await supabase
        .from('interests')
        .select('job_id, jobs(title, posted_by)')
        .eq('user_id', user.id)
        .eq('status', 'SELECTED')

      const convos: Conversation[] = []
      const processedJobIds = new Set<string>()

      // Add jobs from messages
      if (allMessages) {
        const uniqueJobs = [...new Set(allMessages.map(m => m.job_id))]
        
        for (const jobId of uniqueJobs.slice(0, 10)) {
          if (processedJobIds.has(jobId)) continue
          processedJobIds.add(jobId)

          const jobMessages = allMessages.filter(m => m.job_id === jobId)
          const lastMsg = jobMessages[0]
          
          const { data: jobData } = await supabase
            .from('jobs')
            .select('title, posted_by')
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
      }

      // Add jobs where user was accepted but no messages yet
      if (acceptedJobs) {
        for (const accepted of acceptedJobs) {
          if (processedJobIds.has(accepted.job_id)) continue
          processedJobIds.add(accepted.job_id)

          convos.push({
            job_id: accepted.job_id,
            job_title: accepted.jobs?.[0]?.title || 'Job',
            other_user_id: accepted.jobs?.[0]?.posted_by || '',
            other_user_name: 'Poster',
            last_message: 'Click to start chatting',
            last_message_at: new Date().toISOString()
          })
        }
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
    if (!newMessage.trim() || !currentJobId || !currentUserId) {
      // Try to get from activeConversation as fallback
      if (!activeConversation || !newMessage.trim()) return
    }

    const jobId = currentJobId || activeConversation
    const otherUserId = currentUserId || conversations.find(c => c.job_id === activeConversation)?.other_user_id
    
    if (!jobId || !otherUserId) return

    setSending(true)

    const { error } = await supabase.from('messages').insert({
      job_id: jobId,
      sender_id: user.id,
      receiver_id: otherUserId,
      message_text: newMessage,
    })

    if (!error) {
      setNewMessage('')
      loadMessages(jobId, otherUserId)
      loadConversations()
      loadNotifications()
    }

    setSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Categorize notifications
  const interestsList = notifications.filter(n => !n.status || n.status === 'INTERESTED')
  const acceptedList = notifications.filter(n => n.status === 'SELECTED')
  const declinedList = notifications.filter(n => n.status === 'DECLINED')

  const getNotificationCount = () => interestsList.length

  // Deduplicate acceptedList by job_id - filter out notification entries
  const acceptedMap = new Map<string, any>()
  acceptedList.filter(a => 
    a.type !== 'my_response' && 
    !a.from_name.includes('✓') &&
    !a.from_name.includes('✗')
  ).forEach(a => {
    if (!acceptedMap.has(a.job_id)) {
      acceptedMap.set(a.job_id, a)
    }
  })
  const uniqueAccepted = Array.from(acceptedMap.values())

  // Combine accepted + conversations for "Chats" (deduplicated by job_id)
  const chatMap = new Map<string, any>()
  
  // Add accepted jobs first
  uniqueAccepted.forEach(a => {
    chatMap.set(a.job_id, {
      job_id: a.job_id,
      job_title: a.job_title,
      other_user_id: a.from_user_id,
      other_user_name: a.from_name,
      last_message: a.message,
      last_message_at: a.created_at
    })
  })
  
  // Add conversations (only if not already in map)
  conversations.forEach(c => {
    if (!chatMap.has(c.job_id)) {
      chatMap.set(c.job_id, c)
    }
  })
  
  const allChats = Array.from(chatMap.values())

  const handleAcceptFromMessages = async (jobId: string, userId: string, name: string) => {
    // Update interest status
    await supabase
      .from('interests')
      .update({ status: 'SELECTED' })
      .eq('job_id', jobId)
      .eq('user_id', userId)

    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'AWARDED' })
      .eq('id', jobId)

    // Reload notifications so they appear in accepted tab
    await loadNotifications()
    
    // Show success then switch to accepted tab and open chat
    setShowAcceptSuccess(true)
    setCurrentJobId(jobId)
    setCurrentUserId(userId)
    
    setTimeout(() => {
      setShowAcceptSuccess(false)
      setActiveTab('accepted')
      router.push(`/messages?job=${jobId}&user=${userId}`)
    }, 1500)
  }

  const handleDeclineFromMessages = async (jobId: string, userId: string) => {
    await supabase
      .from('interests')
      .update({ status: 'DECLINED' })
      .eq('job_id', jobId)
      .eq('user_id', userId)

    loadNotifications()
  }

  const handleUndoDecline = async (jobId: string, userId: string) => {
    // Reset status back to interested
    await supabase
      .from('interests')
      .update({ status: 'INTERESTED' })
      .eq('job_id', jobId)
      .eq('user_id', userId)

    loadNotifications()
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  if (error) {
    return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white text-slate-900">
      {/* Sidebar */}
      <div className="w-1/3 border-r overflow-y-auto bg-white text-slate-900">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('interests')}
            className={`flex-1 p-3 text-center font-medium whitespace-nowrap ${
              activeTab === 'interests' 
                ? 'border-b-2 border-slate-900 text-slate-900' 
                : 'text-black'
            }`}
          >
            Interests ({getNotificationCount()})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 p-3 text-center font-medium whitespace-nowrap ${
              activeTab === 'accepted' 
                ? 'border-b-2 border-slate-900 text-slate-900' 
                : 'text-black'
            }`}
          >
            Accepted ({acceptedList.length})
          </button>
          <button
            onClick={() => setActiveTab('declined')}
            className={`flex-1 p-3 text-center font-medium whitespace-nowrap ${
              activeTab === 'declined' 
                ? 'border-b-2 border-slate-900 text-slate-900' 
                : 'text-black'
            }`}
          >
            Declined ({declinedList.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 p-3 text-center font-medium whitespace-nowrap ${
              activeTab === 'applications' 
                ? 'border-b-2 border-black text-black' 
                : 'text-black'
            }`}
          >
            My Apps
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 p-3 text-center font-medium whitespace-nowrap ${
              activeTab === 'chats' 
                ? 'border-b-2 border-black text-black' 
                : 'text-black'
            }`}
          >
            Chats ({allChats.length})
          </button>
        </div>

        {/* Interests Tab */}
        {activeTab === 'interests' && (
          <div>
            {interestsList.length === 0 ? (
              <div className="p-4 text-black text-center">
                No new interests on your jobs.
              </div>
            ) : (
              <div>
                {interestsList.map(notif => (
                  <div
                    key={notif.id}
                    className="block p-4 border-b hover:bg-slate-50"
                  >
                    <Link href={`/jobs/${notif.job_id}`}>
                      <div className="font-medium cursor-pointer">{notif.from_name}</div>
                      <div className="text-sm text-black">{notif.from_company}</div>
                      <div className="text-xs text-black mt-1">re: {notif.job_title}</div>
                      {notif.message && (
                        <div className="mt-2 text-sm text-slate-600 italic line-clamp-2">
                          "{notif.message}"
                        </div>
                      )}
                    </Link>
                    <div className="mt-2 flex gap-4 items-center">
                      <Link 
                        href={`/contractor/${notif.from_user_id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Profile
                      </Link>
                      <button 
                        onClick={() => handleAcceptFromMessages(notif.job_id, notif.from_user_id, notif.from_name)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleDeclineFromMessages(notif.job_id, notif.from_user_id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accepted Tab */}
        {activeTab === 'accepted' && (
          <div>
            {acceptedList.length === 0 ? (
              <div className="p-4 text-black text-center">
                No accepted contractors yet.
              </div>
            ) : (
              <div>
                {acceptedList.map(notif => (
                  <div
                    key={notif.id}
                    className="block p-4 border-b hover:bg-slate-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-green-600">✓ {notif.from_name}</div>
                        <div className="text-sm text-black">{notif.from_company}</div>
                        <div className="text-xs text-black">re: {notif.job_title}</div>
                      </div>
                      <Link 
                        href={`/messages?job=${notif.job_id}&user=${notif.from_user_id}`}
                        className="bg-slate-900 text-white px-3 py-1 rounded text-sm"
                      >
                        Chat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Declined Tab */}
        {activeTab === 'declined' && (
          <div>
            {declinedList.length === 0 ? (
              <div className="p-4 text-black text-center">
                No declined contractors.
              </div>
            ) : (
              <div>
                {declinedList.map(notif => (
                  <div
                    key={notif.id}
                    className="block p-4 border-b hover:bg-slate-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-red-600">✗ {notif.from_name}</div>
                        <div className="text-sm text-black">{notif.from_company}</div>
                        <div className="text-xs text-black">re: {notif.job_title}</div>
                      </div>
                      <button 
                        onClick={() => handleUndoDecline(notif.job_id, notif.from_user_id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Applications Tab - for subs to see their applications */}
        {activeTab === 'applications' && (
          <div>
            <div className="p-4 text-black text-center">
              My Applications - coming soon!
            </div>
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === 'chats' && (
          <div>
            {allChats.length === 0 ? (
              <div className="p-4 text-black text-center">
                No conversations yet.
              </div>
            ) : (
              <div>
                {allChats.map((chat) => (
                  <div
                    key={chat.job_id}
                    onClick={() => {
                      setActiveConversation(chat.job_id)
                      setCurrentJobId(chat.job_id)
                      setCurrentUserId(chat.other_user_id)
                      loadMessages(chat.job_id, chat.other_user_id)
                    }}
                    className={`block p-4 border-b hover:bg-gray-50 cursor-pointer ${
                      activeConversation === chat.job_id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="font-medium text-black">{chat.job_title}</div>
                    <div className="text-sm text-black">{chat.other_user_name}</div>
                    <div className="text-xs text-black mt-1">{chat.last_message}</div>
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
                      msg.sender_id === user.id ? 'text-black' : 'text-black'
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
          <div className="flex-1 flex items-center justify-center text-black">
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
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-slate-900">TradeSource</Link>
        </div>
      </header>
      <Suspense fallback={<div className="p-8 text-center text-slate-900">Loading...</div>}>
        <MessagesContent />
      </Suspense>
    </div>
  )
}
