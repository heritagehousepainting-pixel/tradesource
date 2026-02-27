'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import RatingPopup from '@/components/RatingPopup'

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
  status: string
  created_at: string
  posted_by: string
  awarded_to: string
  users: {
    first_name: string
    last_name: string
    company_name: string
    is_verified: boolean
  }
}

interface Interest {
  id: string
  user_id: string
  message: string
  status: string
  created_at: string
  users: {
    first_name: string
    last_name: string
    company_name: string
    trade_type: string
  }
}

export default function JobDetail() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRating, setShowRating] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [alreadyInterested, setAlreadyInterested] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isPoster, setIsPoster] = useState(false)
  const [interests, setInterests] = useState<Interest[]>([])

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
    // Get user profile for verification check
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    if (profile) {
      setUserProfile(profile)
    }
    fetchJob()
  }

  const fetchJob = async () => {
    const jobId = params.id as string
    
    const { data: jobData } = await supabase
      .from('jobs')
      .select('*, users(first_name, last_name, company_name, is_verified)')
      .eq('id', jobId)
      .single()
    
    if (jobData) {
      setJob(jobData)
      
      // Check if current user is the poster
      if (jobData.posted_by === user?.id) {
        setIsPoster(true)
        // Fetch interests for this job
        const { data: interestsData } = await supabase
          .from('interests')
          .select('*, users(first_name, last_name, company_name, trade_type)')
          .eq('job_id', jobId)
          .order('created_at', { ascending: false })
        
        if (interestsData) {
          setInterests(interestsData)
        }
      } else {
        // Check if already interested
        const { data: interestData } = await supabase
          .from('interests')
          .select('*')
          .eq('job_id', jobId)
          .eq('user_id', user?.id)
        
        if (interestData && interestData.length > 0) {
          setAlreadyInterested(true)
        }
      }
    }
    setLoading(false)
  }

  const handleInterested = async () => {
    if (!user || !job) return
    
    setSubmitting(true)
    setError('')
    
    const { error } = await supabase.from('interests').insert({
      job_id: job.id,
      user_id: user.id,
      message: message,
      status: 'INTERESTED',
    })

    if (error) {
      setError(error.message)
    } else {
      setAlreadyInterested(true)
      setSubmitted(true)
    }
    
    setSubmitting(false)
  }

  const handleStartChat = async (interest: Interest) => {
    if (!user || !job) return
    
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('job_id', job.id)
      .eq('sender_id', interest.user_id)
      .eq('receiver_id', user.id)
      .limit(1)

    if (existingMessages && existingMessages.length > 0) {
      router.push(`/messages?conversation=${job.id}`)
    } else {
      router.push(`/messages?job=${job.id}&user=${interest.user_id}`)
    }
  }

  const handleAccept = async (interest: Interest) => {
    if (!user || !job) return
    
    // Update interest status
    await supabase
      .from('interests')
      .update({ status: 'SELECTED' })
      .eq('id', interest.id)

    // Update job status to awarded and store awarded contractor
    await supabase
      .from('jobs')
      .update({ 
        status: 'AWARDED',
        awarded_to: interest.user_id 
      })
      .eq('id', job.id)
    
    // Log the award in job history
    await supabase.from('job_history').insert({
      user_id: job.posted_by,
      job_id: job.id,
      action: 'AWARDED'
    })
    
    // Start chat
    router.push(`/messages?job=${job.id}&user=${interest.user_id}`)
  }

  const handleDecline = async (interest: Interest) => {
    if (!user || !job) return
    
    await supabase
      .from('interests')
      .update({ status: 'DECLINED' })
      .eq('id', interest.id)
    
    // Refresh interests
    const { data: interestsData } = await supabase
      .from('interests')
      .select('*, users(first_name, last_name, company_name, trade_type)')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
    
    if (interestsData) {
      setInterests(interestsData)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center">Job not found</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold">← Back to Feed</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/feed">Feed</Link>
            <Link href="/jobs/post">Post</Link>
            <Link href="/messages">Messages</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="border rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className={`text-xs px-2 py-1 rounded ${job.is_b2c ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {job.is_b2c ? 'Homeowner Project' : 'Overflow Job'}
              </span>
              <h1 className="text-2xl font-bold mt-2">{job.title}</h1>
            </div>
            <span className="text-2xl font-bold text-green-700">
              ${job.price_amount?.toLocaleString()}
            </span>
          </div>

          <div className="flex gap-4 text-sm text-black mb-4">
            <span>📍 {job.county}</span>
            <span>🏠 {job.work_category}</span>
            <span>💰 {job.price_type}</span>
            <span>📋 {job.job_type}</span>
          </div>

          <p className="text-black mb-4">{job.description}</p>

          {/* Posted by */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-black mb-2">Posted by</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {job.users?.company_name || 'Individual Contractor'}
                  </span>
                  {job.users?.is_verified && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">✓ Verified</span>
                  )}
                </div>
              </div>
              {/* Delete button for poster */}
              {job && user && job.posted_by === user.id && (
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this job? This cannot be undone.')) {
                      // Log deletion BEFORE deleting - save title too
                      await supabase.from('job_history').insert({
                        user_id: user.id,
                        job_id: job.id,
                        job_title: job.title,  // Save title in case job gets deleted
                        action: 'DELETED'
                      })
                      await supabase.from('jobs').delete().eq('id', job.id)
                      // Go to feed
                      router.push('/feed')
                    }
                  }}
                  className="text-red-600 text-sm hover:underline"
                >
                  🗑️ Delete Job
                </button>
              )}
            </div>
          </div>

          {/* Completed Banner with Review Button */}
          {job.status === 'COMPLETED' && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
              <p className="font-bold text-green-800 text-center mb-3">✅ This job has been completed!</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowRating(true)}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium"
                >
                  ⭐ Leave a Review
                </button>
              </div>
            </div>
          )}

          {/* Mark Complete Button (when job is AWARDED, IN_PROGRESS, or COMPLETED) */}
          {(job.status === 'AWARDED' || job.status === 'IN_PROGRESS' || job.status === 'COMPLETED') && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-green-800">Job Status: {job.status}</p>
                  <p className="text-sm text-green-700">This job has been awarded to a contractor.</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Mark this job as complete and leave a review?')) {
                      setShowRating(true)
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  ✓ Mark Complete
                </button>
              </div>
            </div>
          )}

          {/* If user is the poster, show interests */}
          {isPoster && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Contractors Interested ({interests.length})</h3>
              
              {interests.length === 0 ? (
                <p className="text-black">No contractors have expressed interest yet.</p>
              ) : (
                <div className="space-y-3">
                  {interests.map(interest => (
                    <div key={interest.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            href={`/contractor/${interest.user_id}`}
                            className="font-medium hover:underline"
                          >
                            {interest.users?.first_name} {interest.users?.last_name}
                          </Link>
                          <p className="text-sm text-black">
                            {interest.users?.company_name || 'Individual'} • {interest.users?.trade_type}
                          </p>
                          {interest.status === 'SELECTED' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Selected</span>
                          )}
                          {interest.status === 'DECLINED' && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Declined</span>
                          )}
                        </div>
                        {interest.status !== 'SELECTED' && interest.status !== 'DECLINED' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(interest)}
                              className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(interest)}
                              className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {interest.status === 'SELECTED' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartChat(interest)}
                              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm"
                            >
                              Message
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Mark this job as complete?')) {
                                  // Update job status
                                  await supabase
                                    .from('jobs')
                                    .update({ status: 'COMPLETED' })
                                    .eq('id', job.id)
                                  // Log completion
                                  await supabase.from('job_history').insert({
                                    user_id: job.posted_by,
                                    job_id: job.id,
                                    action: 'COMPLETED'
                                  })
                                  // Refresh
                                  fetchJob()
                                }
                              }}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                            >
                              Mark Complete
                            </button>
                          </div>
                        )}
                      </div>
                      {interest.message && (
                        <div className="mt-3 p-3 bg-slate-50 rounded">
                          <p className="text-sm text-black italic">"{interest.message}"</p>
                        </div>
                      )}
                      <p className="text-xs text-black mt-2">
                        Click name to view profile & reviews
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* If user is NOT the poster, show interested button */}
          {job && user && job.posted_by !== user.id && !alreadyInterested && !submitted && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Express Interest</h3>
              
              {/* Verification Required for Contractors */}
              {userProfile?.user_type === 'CONTRACTOR' && userProfile?.verification_status !== 'APPROVED' && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                  <p className="text-black text-sm mb-2">
                    🔒 <strong>Verification required</strong> to apply to jobs.
                  </p>
                  <Link href="/profile" className="text-blue-600 text-sm underline">
                    Complete verification →
                  </Link>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-3 text-sm">
                  {error}
                </div>
              )}
              <textarea
                className="w-full border rounded-lg p-3 mb-3"
                rows={3}
                placeholder="Introduce yourself and explain why you're a good fit..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={userProfile?.user_type === 'CONTRACTOR' && userProfile?.verification_status !== 'APPROVED'}
              />
              <button
                onClick={handleInterested}
                disabled={submitting || (userProfile?.user_type === 'CONTRACTOR' && userProfile?.verification_status !== 'APPROVED')}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : "I'm Interested"}
              </button>
            </div>
          )}

          {alreadyInterested && (
            <div className="border-t pt-6">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
                ✓ You've expressed interest in this job
              </div>
            </div>
          )}

          {submitted && (
            <div className="border-t pt-6">
              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-center">
                ✓ Interest submitted! The poster will be notified.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Rating Popup - show after job is awarded */}
      {showRating && job && user && (
        <RatingPopup
          job={job}
          currentUserId={user.id}
          otherUserId={interests.find(i => i.status === 'SELECTED')?.user_id || job.awarded_to || ''}
          otherUserName={interests.find(i => i.status === 'SELECTED')?.users?.first_name || 'Contractor'}
          onComplete={() => {
            setShowRating(false)
            fetchJob()
          }}
          onCancel={() => setShowRating(false)}
        />
      )}
    </div>
  )
}
