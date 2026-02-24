'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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

export default function Messages() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  useEffect(() => {
    // Check for new conversation from URL params
    const jobId = searchParams.get('job')
    const otherUserId = searchParams.get('user')
    
    if (jobId && otherUserId) {
      setActiveConversation(jobId)
      loadMessages(jobId, otherUserId)
      // Clear URL params
      router.replace('/messages')
    }
  }, [searchParams, user])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/signin')
      return
    }
    setUser(user)
  }

  const loadConversations = async () => {
    // Get all messages where user is sender or receiver
    const { data: allMessages } = await supabase
      .from('messages')
      .select('job_id, sender_id, receiver_id, created_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!allMessages) return

    // Get unique job conversations
    const uniqueJobs = [...new Set(allMessages.map(m => m.job_id))]
    
    const convos: Conversation[] = []
    
    for (const jobId of uniqueJobs) {
      const jobMessages = allMessages.filter(m => m.job_id === jobId)
      const lastMsg = jobMessages[0]
      
      // Get job info
      const { data: jobData } = await supabase
        .from('jobs')
        .select('title, posted_by')
        .eq('id', jobId)
        .single()
      
      if (!jobData) continue

      // Determine other user
      const otherUserId = lastMsg.sender_id === user.id ? lastMsg.receiver_id : lastMsg.sender_id
      
      // Get other user info
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, company_name')
        .eq('id', otherUserId)
        .single()

      // Get last message text
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
        other_user_name: userData ? 
          `${userData.first_name} ${userData.last_name}` : 'Unknown',
        last_message: lastMsgText?.message_text || '',
        last_message_at: lastMsg.created_at
      })
    }

    // Sort by most recent
    convos.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    setConversations(convos)
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

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">TradeSource</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed">Feed</Link>
            <Link href="/jobs/post">Post</Link>
            <Link href="/messages" className="font-medium">Messages</Link>
            <Link href="/profile">Profile</Link>
          </nav>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Conversations List */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          
          {conversations.length === 0 ? (
            <div className="p-4 text-slate-500 text-center">
              No conversations yet. Express interest in jobs to start chatting!
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
                <div ref={messagesEndRef} />
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
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
