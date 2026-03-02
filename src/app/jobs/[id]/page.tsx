'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import RatingPopup from '@/components/RatingPopup'
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
  status: string
  created_at: string
  posted_by: string
  awarded_to: string
  media_urls: string[]
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
  const [isSelectedContractor, setIsSelectedContractor] = useState(false)
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
          
          // Check if current user is the selected contractor
          const selected = interestsData?.find((i: any) => i.status === 'SELECTED' && i.user_id === user?.id)
          if (selected) {
            setIsSelectedContractor(true)
          }
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
      // Create notification for the job poster
      await supabase.from('notifications').insert({
        user_id: job.posted_by,
        type: 'interest',
        title: 'New Interest',
        message: `${user.email} is interested in your job: ${job.title}`,
        job_id: job.id,
        from_user_id: user.id,
      })
      
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Simple Back Button */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <Link href="/feed" className="flex items-center gap-2 text-gray-900 font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <main className="max-w-4xl mx-auto px-3 md:px-6 py-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          
          {/* Header - Title & Price */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              job.is_b2c 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {job.is_b2c ? '🏠 Homeowner' : '💼 Contractor'}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{job.title}</h1>
            <p className="text-3xl font-bold text-blue-600 mt-1">${job.price_amount?.toLocaleString()}</p>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-semibold text-gray-900">📍 {job.county}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Type</p>
              <p className="font-semibold text-gray-900">{job.work_category}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Payment</p>
              <p className="font-semibold text-gray-900">{job.price_type}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Timeline</p>
              <p className="font-semibold text-gray-900">{job.job_type}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 text-sm">{job.description || 'No description provided.'}</p>
          </div>

          {/* Media Gallery */}
          {job.media_urls && job.media_urls.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">📷 Photos</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {job.media_urls.map((url, index) => (
                  <div key={index} className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {url.match(/\.(mp4|webm|mov)$/i) ? (
                      <video src={url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posted by */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500">Posted by</p>
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="font-semibold text-gray-900">
                  {job.users?.company_name || 'User'}
                </span>
                {job.users?.is_verified && (
                  <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ Verified</span>
                )}
              </div>
              {job && user && job.posted_by === user.id && (
                <button
                  onClick={async () => {
                    if (confirm('Delete this job?')) {
                      await supabase.from('job_history').insert({
                        user_id: user.id, job_id: job.id, job_title: job.title, action: 'DELETED'
                      })
                      await supabase.from('jobs').delete().eq('id', job.id)
                      router.push('/feed')
                    }
                  }}
                  className="text-red-600 text-sm"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* Completed Banner with Review Button */}
          {job.status === 'COMPLETED' && (
            <div className="bg-[#10B981]/10 border border-green-300 rounded-xl p-4 mb-6">
              <p className="font-bold text-green-800 text-center mb-3">✅ This job has been completed!</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowRating(true)}
                  className="bg-[#0F172A] text-white px-4 py-2 rounded-xl font-medium"
                >
                  ⭐ Leave a Review
                </button>
              </div>
            </div>
          )}

          {/* Job Status & Actions - Show for awarded contractor OR homeowner */}
          {(job.status === 'AWARDED' || job.status === 'IN_PROGRESS' || job.status === 'COMPLETED') && (isPoster || isSelectedContractor) && (
            <div className="bg-gradient-to-r from-green-50 to-white border border-green-200 rounded-xl md:rounded-2xl p-4 md:p-6 mb-6 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-green-800 text-lg">Job Status: {job.status.replace('_', ' ')}</p>
                  {job.status === 'AWARDED' && isSelectedContractor && (
                    <p className="text-sm text-gray-500">You've been awarded this job. Ready to start?</p>
                  )}
                  {job.status === 'AWARDED' && isPoster && (
                    <p className="text-sm text-gray-500">A contractor has been awarded. Track progress below.</p>
                  )}
                  {job.status === 'IN_PROGRESS' && (
                    <p className="text-sm text-gray-500">Work in progress. {isPoster ? 'The contractor is working on this.' : 'Mark complete when done.'}</p>
                  )}
                  {job.status === 'COMPLETED' && (
                    <p className="text-sm text-gray-500">Job completed! ✅</p>
                  )}
                </div>
                {job.status === 'AWARDED' && isSelectedContractor && (
                  <button
                    onClick={async () => {
                      if (confirm('Start working on this job?')) {
                        await supabase.from('jobs').update({ status: 'IN_PROGRESS' }).eq('id', job.id)
                        fetchJob()
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    🚀 Start Job
                  </button>
                )}
                {(job.status === 'IN_PROGRESS' || job.status === 'AWARDED') && (isPoster || isSelectedContractor) && (
                  <button
                    onClick={() => {
                      if (confirm('Mark this job as complete and leave a review?')) {
                        setShowRating(true)
                      }
                    }}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    ✓ Mark Complete
                  </button>
                )}
                {job.status === 'COMPLETED' && (
                  <div className="bg-green-100 text-green-700 px-6 py-3 rounded-xl font-bold">
                    ✅ Completed
                  </div>
                )}
              </div>
            </div>
          )}

          {/* If user is the poster, show interests */}
          {isPoster && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Contractors Interested ({interests.length})</h3>
              
              {interests.length === 0 ? (
                <p className="text-[#0F172A]">No contractors have expressed interest yet.</p>
              ) : (
                <div className="space-y-3">
                  {interests.map(interest => (
                    <div key={interest.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            href={`/contractor/${interest.user_id}`}
                            className="font-medium hover:underline"
                          >
                            {interest.users?.first_name} {interest.users?.last_name}
                          </Link>
                          <p className="text-sm text-[#0F172A]">
                            {interest.users?.company_name || 'Individual'} • {interest.users?.trade_type}
                          </p>
                          {interest.status === 'SELECTED' && (
                            <span className="text-xs bg-[#10B981]/10 text-[#10B981] px-2 py-1 rounded">Selected</span>
                          )}
                          {interest.status === 'DECLINED' && (
                            <span className="text-xs bg-[#EF4444]/10 text-[#EF4444] px-2 py-1 rounded">Declined</span>
                          )}
                        </div>
                        {interest.status !== 'SELECTED' && interest.status !== 'DECLINED' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(interest)}
                              className="bg-green-600 text-white px-3 py-2 rounded-xl text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(interest)}
                              className="bg-[#EF4444]/10 text-[#EF4444] px-3 py-2 rounded-xl text-sm"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {interest.status === 'SELECTED' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartChat(interest)}
                              className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm"
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
                              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm"
                            >
                              Mark Complete
                            </button>
                          </div>
                        )}
                      </div>
                      {interest.message && (
                        <div className="mt-3 p-3 bg-slate-50 rounded">
                          <p className="text-sm text-[#0F172A] italic">"{interest.message}"</p>
                        </div>
                      )}
                      <p className="text-xs text-[#0F172A] mt-2">
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
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-4">
                  <p className="text-[#0F172A] text-sm mb-2">
                    🔒 <strong>Verification required</strong> to apply to jobs.
                  </p>
                  <Link href="/profile" className="text-blue-600 text-sm underline">
                    Complete verification →
                  </Link>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-3 text-sm">
                  {error}
                </div>
              )}
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 mb-3"
                rows={3}
                placeholder="Introduce yourself and explain why you're a good fit..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={userProfile?.user_type === 'CONTRACTOR' && userProfile?.verification_status !== 'APPROVED'}
              />
              <button
                onClick={handleInterested}
                disabled={submitting || (userProfile?.user_type === 'CONTRACTOR' && userProfile?.verification_status !== 'APPROVED')}
                className="w-full bg-[#0F172A] text-white py-3 rounded-xl font-medium hover:bg-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : "I'm Interested"}
              </button>
            </div>
          )}

          {alreadyInterested && (
            <div className="border-t pt-6">
              <div className="bg-green-50 text-[#10B981] p-4 rounded-xl text-center">
                ✓ You've expressed interest in this job
              </div>
            </div>
          )}

          {submitted && (
            <div className="border-t pt-6">
              <div className="bg-blue-50 text-[#3B82F6] p-4 rounded-xl text-center">
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
      <BottomNav />
    </div>
  )
}
