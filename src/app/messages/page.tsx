'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Interest {
  id: string
  job_id: string
  user_id: string
  message: string
  status: string
  created_at: string
  jobs?: {
    title: string
  }
  users?: {
    first_name: string
    last_name: string
    company_name: string
  }
}

interface Chat {
  id: string
  job_id: string
  participants: string[]
  created_at: string
  jobs?: {
    title: string
  }
  messages?: {
    content: string
    sender_id: string
    created_at: string
  }[]
}

export default function Messages() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  )
}

function MessagesContent() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'interests' | 'chats'>('interests')
  const [interestTab, setInterestTab] = useState<'pending' | 'accepted'>('pending')
  const [interests, setInterests] = useState<Interest[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'accepted' || tab === 'chats') {
      setActiveTab(tab === 'accepted' ? 'interests' : 'chats')
      if (tab === 'accepted') setInterestTab('accepted')
    }
  }, [searchParams])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/signin'
      return
    }
    setUser(user)
    fetchData()
  }

  const fetchData = async () => {
    // Fetch interests where user is the poster
    const { data: interestsData } = await supabase
      .from('interests')
      .select('*, jobs(title), users(first_name, last_name, company_name)')
      .eq('job_id', '00000000-0000-0000-0000-000000000000') // Placeholder - needs proper query
    
    // Get jobs posted by current user
    const { data: userJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('posted_by', user.id)
    
    const jobIds = userJobs?.map(j => j.id) || []
    
    // Fetch interests for user's jobs
    if (jobIds.length > 0) {
      const { data: interestsResult } = await supabase
        .from('interests')
        .select('*, jobs(title), users(first_name, last_name, company_name)')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
      
      if (interestsResult) setInterests(interestsResult)
    }

    // Fetch chats
    const { data: chatsData } = await supabase
      .from('chats')
      .select('*, jobs(title), messages(content, sender_id, created_at)')
      .contains('participants', [user.id])
      .order('created_at', { ascending: false })
    
    if (chatsData) setChats(chatsData)
    setLoading(false)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedInterest || !user) return

    const { error } = await supabase.from('messages').insert({
      chat_id: selectedInterest.id,
      sender_id: user.id,
      content: message
    })

    if (!error) {
      setMessage('')
      fetchMessages(selectedInterest.id)
    }
  }

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    
    if (data) setMessages(data)
  }

  const pendingInterests = interests.filter(i => i.status === 'INTERESTED')
  const acceptedInterests = interests.filter(i => i.status === 'SELECTED')

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold">TradeSource</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed" className="text-black">Feed</Link>
            <Link href="/jobs/post" className="text-black">Post</Link>
            <Link href="/messages" className="text-black font-medium">Messages</Link>
            <Link href="/profile" className="text-black">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('interests')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'interests' 
                ? 'border-b-2 border-slate-900 text-black' 
                : 'text-black'
            }`}
          >
            Interests ({pendingInterests.length})
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'chats' 
                ? 'border-b-2 border-slate-900 text-black' 
                : 'text-black'
            }`}
          >
            Chats ({chats.length})
          </button>
        </div>

        {activeTab === 'interests' && (
          <>
            {/* Interest Sub-tabs */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setInterestTab('pending')}
                className={`text-sm font-medium ${
                  interestTab === 'pending' ? 'text-black underline' : 'text-gray-500'
                }`}
              >
                Pending ({pendingInterests.length})
              </button>
              <button
                onClick={() => setInterestTab('accepted')}
                className={`text-sm font-medium ${
                  interestTab === 'accepted' ? 'text-black underline' : 'text-gray-500'
                }`}
              >
                Accepted ({acceptedInterests.length})
              </button>
            </div>

            {/* Interests List */}
            {(interestTab === 'pending' ? pendingInterests : acceptedInterests).length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl">
                <p className="text-gray-500">No interests yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(interestTab === 'pending' ? pendingInterests : acceptedInterests).map(interest => (
                  <div key={interest.id} className="border rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {interest.users?.first_name} {interest.users?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{interest.users?.company_name}</p>
                        <p className="text-sm mt-2">{interest.jobs?.title}</p>
                        {interest.message && (
                          <p className="text-sm mt-2 p-2 bg-slate-50 rounded">{interest.message}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/contractor/${interest.user_id}`}
                          className="text-blue-600 text-sm underline"
                        >
                          View Profile
                        </Link>
                        {interestTab === 'pending' && (
                          <button
                            onClick={async () => {
                              await supabase
                                .from('interests')
                                .update({ status: 'SELECTED' })
                                .eq('id', interest.id)
                              await supabase
                                .from('jobs')
                                .update({ status: 'AWARDED' })
                                .eq('id', interest.job_id)
                              fetchData()
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'chats' && (
          <div className="space-y-3">
            {chats.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl">
                <p className="text-gray-500">No chats yet.</p>
              </div>
            ) : (
              chats.map(chat => (
                <div key={chat.id} className="border rounded-xl p-4">
                  <p className="font-semibold">{chat.jobs?.title}</p>
                  <p className="text-sm text-gray-500">
                    {chat.messages?.slice(-1)[0]?.content || 'No messages'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
