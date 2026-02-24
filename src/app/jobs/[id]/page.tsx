'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
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
  status: string
  created_at: string
  posted_by: string
}

export default function JobDetail() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [alreadyInterested, setAlreadyInterested] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
    fetchJob()
  }

  const fetchJob = async () => {
    const jobId = params.id as string
    
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    
    if (jobData) {
      setJob(jobData)
      
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
    setLoading(false)
  }

  const handleInterested = async () => {
    if (!user || !job) return
    
    setSubmitting(true)
    
    const { error } = await supabase.from('interests').insert({
      job_id: job.id,
      user_id: user.id,
      message: message,
      status: 'INTERESTED',
    })

    if (!error) {
      setAlreadyInterested(true)
      setSubmitted(true)
    }
    
    setSubmitting(false)
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

          <div className="flex gap-4 text-sm text-slate-500 mb-4">
            <span>📍 {job.county}</span>
            <span>🏠 {job.work_category}</span>
            <span>💰 {job.price_type}</span>
            <span>📋 {job.job_type}</span>
          </div>

          <p className="text-slate-600 mb-6">{job.description}</p>

          {/* Interested Section */}
          {!alreadyInterested && !submitted && job.posted_by !== user?.id && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Express Interest</h3>
              <textarea
                className="w-full border rounded-lg p-3 mb-3"
                rows={3}
                placeholder="Introduce yourself and explain why you're a good fit..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <button
                onClick={handleInterested}
                disabled={submitting}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
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
    </div>
  )
}
