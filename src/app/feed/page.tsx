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
}

export default function Feed() {
  const router = useRouter()
  const supabase = createClient()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [countyFilter, setCountyFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)

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
    // Check if admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (userData?.is_admin || user.email?.includes('heritagehousepainting')) {
      setIsAdmin(true)
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

  const fetchJobs = async () => {
    let query = supabase
      .from('jobs')
      .select('*')
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
    searchQuery === '' || 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">TradeSource</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed" className="font-medium">Feed</Link>
            <Link href="/jobs/post" className="text-black hover:text-slate-900">Post</Link>
            <Link href="/messages" className="text-black hover:text-slate-900 relative">
              Messages
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-green-600 hover:text-green-700 font-medium">Admin</Link>
            )}
            <Link href="/profile" className="text-black hover:text-slate-900">Profile</Link>
            <button onClick={handleSignOut} className="text-black hover:text-slate-900">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Job Feed</h1>
          <Link href="/jobs/post" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Post a Job
          </Link>
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
              <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                <div className="border rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs px-2 py-1 rounded ${job.is_b2c ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {job.is_b2c ? 'Homeowner Project' : 'Overflow Job'}
                      </span>
                      <h3 className="font-semibold mt-2">{job.title}</h3>
                    </div>
                    <span className="text-lg font-bold text-green-700">
                      ${job.price_amount?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-black text-sm mb-2 line-clamp-2">{job.description}</p>
                  <div className="flex gap-4 text-sm text-black">
                    <span>📍 {job.county}</span>
                    <span>🏠 {job.work_category}</span>
                    <span>💰 {job.price_type}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
