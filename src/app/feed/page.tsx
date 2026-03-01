'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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
    
    // Check if admin and get full profile
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (userData) {
      setUserProfile(userData)
      if (userData.is_admin || user.email?.toLowerCase().includes('heritagehousepainting')) {
        setIsAdmin(true)
      } else {
      }
    }
    
    fetchJobs()
    fetchNotifications(user.id)
  }

  const fetchNotifications = async (userId: string) => {
    // Get jobs posted by user
    const { data: myJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('posted_by', userId)
    
    if (myJobs && myJobs.length > 0) {
      const jobIds = myJobs.map(j => j.id)
      // Count interests on user's jobs
      const { count } = await supabase
        .from('interests')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds)
      
      setNotificationCount(count || 0)
    }
  }

  // Check URL for deleted job param on mount - no longer needed since we don't filter

  const fetchJobs = async () => {
    // Force fresh fetch by adding a small delay to ensure DB is updated
    await new Promise(resolve => setTimeout(resolve, 100))
    
    let query = supabase
      .from('jobs')
      .select('id, title, description, county, job_type, work_category, price_type, price_amount, is_b2c, created_at, posted_by')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false })

    if (countyFilter !== 'all') {
      query = query.eq('county', countyFilter)
    }

    if (typeFilter !== 'all') {
      if (typeFilter === 'b2c') {
        query = query.eq('is_b2c', true)
      } else {
        query = query.eq('job_type', typeFilter.toUpperCase())
      }
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

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-black">TradeSource</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed" className="font-medium text-black">Feed</Link>
            <Link href="/contractors" className="text-black">Contractors</Link>
            <Link href="/community" className="text-black">Community</Link>
            <Link href="/jobs/post" className="text-black">Post</Link>
            <Link href="/messages" className="text-black relative">
              Messages
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-green-600 hover:text-green-700 font-medium">🔧 Admin</Link>
            )}
            <Link href="/profile" className="text-black">Profile</Link>
            <button onClick={handleSignOut} className="text-black">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Verification Banner for Unverified Contractors */}
        {isUnverifiedContractor && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-black">🔒 Verification Required</h3>
                <p className="text-sm text-black">Complete verification to unlock full access - see prices and post jobs.</p>
              </div>
              <Link href="/profile" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">
                Verify Now
              </Link>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Job Feed</h1>
          {isUnverifiedContractor ? (
            <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Post a Job (Verify First)
            </button>
          ) : (
            <Link href="/jobs/post" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Post a Job
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Search jobs..."
            className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select 
            className="px-3 py-2 border rounded-lg"
            value={countyFilter}
            onChange={e => setCountyFilter(e.target.value)}
          >
            <option value="all">All Counties</option>
            <option value="Montgomery">Montgomery</option>
            <option value="Bucks">Bucks</option>
            <option value="Philadelphia">Philadelphia</option>
            <option value="Delaware">Delaware</option>
          </select>
          <select 
            className="px-3 py-2 border rounded-lg"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="FULL">Full Job</option>
            <option value="PIECE">Piece Work</option>
            <option value="b2c">Homeowner Projects</option>
          </select>
          <select 
            className="px-3 py-2 border rounded-lg"
            value={timelineFilter}
            onChange={e => setTimelineFilter(e.target.value)}
          >
            <option value="all">Any Timeline</option>
            <option value="ASAP">ASAP</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="FLEXIBLE">Flexible</option>
          </select>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-12 text-black">Loading...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-black">
            No jobs found. Be the first to post!
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <div key={job.id} className="border rounded-xl p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Link href={`/jobs/${job.id}`}>
                      <span className={`text-xs px-2 py-1 rounded ${job.is_b2c ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {job.is_b2c ? 'Homeowner Project' : 'Overflow Job'}
                      </span>
                      <h3 className="font-semibold mt-2">{job.title}</h3>
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${isUnverifiedContractor ? 'blur-sm select-none' : 'text-green-700'}`}>
                      {isUnverifiedContractor ? '••••••' : `$${job.price_amount?.toLocaleString()}`}
                    </span>
                    {job.posted_by === user?.id && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault()
                          if (confirm('Delete this job?')) {
                            // Log deletion with title
                            await supabase.from('job_history').insert({
                              user_id: user.id,
                              job_id: job.id,
                              job_title: job.title,
                              action: 'DELETED'
                            })
                            await supabase.from('jobs').delete().eq('id', job.id)
                            // Refresh feed
                            fetchJobs()
                          }
                        }}
                        className="text-red-500 text-sm hover:underline"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <Link href={`/jobs/${job.id}`}>
                  <p className="text-sm text-black mb-2 line-clamp-2">{job.description}</p>
                  <div className="flex gap-4 text-sm text-black">
                    <span>📍 {job.county}</span>
                    <span>🏠 {job.work_category}</span>
                    <span>💰 {job.price_type}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
