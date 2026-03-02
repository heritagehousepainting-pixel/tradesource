'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export const dynamic = 'force-dynamic'

interface Job {
  id: string
  title: string
  description: string
  county: string
  job_type: string
  work_category: string
  price_type: string
  price_amount: number
  is_b2c: boolean
  created_at: string
  posted_by: string
  timeline?: string
}

export default function Feed() {
  const router = useRouter()
  const supabase = createClient()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [countyFilter, setCountyFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [timelineFilter, setTimelineFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)

  // Check if user is a contractor who needs verification
  const isUnverifiedContractor = userProfile?.user_type === 'CONTRACTOR' && userProfile?.verification_status !== 'APPROVED'

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/signin')
      return
    }
    setUser(user)
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    // Check if admin and get full profile
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (userData) {
      setUserProfile(userData)
      setIsAdmin(userData.email === 'heritagehousepainting@gmail.com')
    }
    
    // Get notification count
    const { data: notifData } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('read', false)
    
    if (notifData) setNotificationCount(notifData.length)

    // Real-time subscription for new notifications
    const channel = supabase
      .channel('feed-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        console.log('New notification:', payload)
        // Refresh notification count
        setNotificationCount(prev => prev + 1)
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('New Notification', {
            body: 'You have a new notification on TradeSource',
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const fetchJobs = async () => {
    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (countyFilter !== 'all') {
      query = query.eq('county', countyFilter)
    }

    if (typeFilter !== 'all') {
      query = query.eq('work_category', typeFilter)
    }

    if (timelineFilter !== 'all') {
      query = query.eq('timeline', timelineFilter.toUpperCase())
    }

    const { data, error } = await query
    
    if (!error && data) {
      setJobs(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, [countyFilter, typeFilter])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredJobs = jobs.filter(job => 
    // Filter by search
    (searchQuery === '' || 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Format time ago
  const timeAgo = (date: string) => {
    const now = new Date()
    const jobDate = new Date(date)
    const diff = Math.floor((now.getTime() - jobDate.getTime()) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 md:px-3 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <Link href="/" className="text-lg md:text-xl font-bold text-gray-900">
            Trade<span className="text-blue-600">Source</span>
          </Link>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-full mx-2 md:max-w-md md:mx-8">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          
          <nav className="flex gap-4 md:p-6 items-center text-xs md:text-sm">
            <Link href="/feed" className="font-semibold text-gray-900">Feed</Link>
            <Link href="/contractors" className="text-gray-600 hover:text-gray-900 transition-colors">Contractors</Link>
            <Link href="/community" className="text-gray-600 hover:text-gray-900 transition-colors">Community</Link>
            <Link href="/jobs/post" className="text-gray-600 hover:text-gray-900 transition-colors">Post</Link>
            <Link href="/messages" className="text-gray-600 hover:text-gray-900 transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                  {notificationCount}
                </span>
              )}
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-gray-900 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold">
                {userProfile?.first_name?.[0] || 'U'}
              </div>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 md:px-3 md:px-6 py-8">
        {/* Page Title */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Job Feed</h1>
            <p className="text-gray-500 mt-1">Find your next project</p>
          </div>
          <Link href="/jobs/post" className="inline-flex items-center gap-2 px-3 md:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:-translate-y-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post a Job
          </Link>
        </div>

        {/* Premium Filters */}
        <div className="bg-white rounded-xl md:rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap gap-4">
            <select 
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="flex-1 min-w-[180px] px-4 py-3 bg-gray-50 border-0 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Counties</option>
              <option value="Montgomery">Montgomery</option>
              <option value="Bucks">Bucks</option>
              <option value="Philadelphia">Philadelphia</option>
              <option value="Delaware">Delaware</option>
              <option value="Chester">Chester</option>
              <option value="Lehigh">Lehigh</option>
            </select>
            
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 min-w-[180px] px-4 py-3 bg-gray-50 border-0 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Interior Painting">Interior Painting</option>
              <option value="Exterior Painting">Exterior Painting</option>
              <option value="Drywall">Drywall</option>
              <option value="Flooring">Flooring</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Roofing">Roofing</option>
            </select>
            
            <select 
              value={timelineFilter}
              onChange={(e) => setTimelineFilter(e.target.value)}
              className="flex-1 min-w-[180px] px-4 py-3 bg-gray-50 border-0 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Any Timeline</option>
              <option value="ASAP">ASAP</option>
              <option value="WITHIN_MONTH">Within Month</option>
              <option value="FLEXIBLE">Flexible</option>
            </select>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 skeleton h-32"></div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl md:rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-4">Be the first to post a project!</p>
            <Link href="/jobs/post" className="inline-flex items-center gap-2 px-3 md:px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post a Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <Link href={`/jobs/${job.id}`} key={job.id} className="block">
                <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          job.is_b2c 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {job.is_b2c ? '🏠 Homeowner' : '💼 Overflow'}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(job.created_at)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isUnverifiedContractor ? 'blur-sm' : 'text-gray-900'}`}>
                        {isUnverifiedContractor ? '••••••' : `$${job.price_amount?.toLocaleString()}`}
                      </div>
                      <div className="text-xs text-gray-500">{job.price_type}</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-500 text-xs md:text-sm mb-4 line-clamp-2">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs md:text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.county}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs md:text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {job.work_category}
                    </span>
                    {job.timeline && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs md:text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {job.timeline.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  
                  {job.posted_by === user?.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={async (e) => {
                          e.preventDefault()
                          if (confirm('Delete this job?')) {
                            await supabase.from('job_history').insert({
                              user_id: user.id,
                              job_id: job.id,
                              job_title: job.title,
                              action: 'DELETED'
                            })
                            await supabase.from('jobs').delete().eq('id', job.id)
                            fetchJobs()
                          }
                        }}
                        className="text-red-500 text-xs md:text-sm hover:text-red-700 transition-colors"
                      >
                        Delete job
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
