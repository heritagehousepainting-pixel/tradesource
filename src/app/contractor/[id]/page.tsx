'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Contractor {
  id: string
  email: string
  user_type: string
  first_name: string
  last_name: string
  company_name: string
  phone: string
  trade_type: string
  service_counties: string[]
  is_verified: boolean
  is_insured: boolean
  years_experience: number
  jobs_completed: number
  avg_rating: number
  review_count: number
  bio: string
  external_reviews: string
  portfolio_urls: string[]
  created_at: string
}

interface Review {
  id: string
  rating: number
  review_text: string
  created_at: string
  jobs: {
    title: string
  }
}

export default function ContractorProfile() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<any[]>([])

  useEffect(() => {
    fetchContractor()
  }, [])

  const fetchContractor = async () => {
    const contractorId = params.id as string
    
    // Fetch contractor info
    const { data: contractorData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', contractorId)
      .single()
    
    console.log('Fetching contractor:', contractorId, 'Error:', error)
    
    if (contractorData) {
      setContractor(contractorData)
      
      // Fetch reviews for this contractor
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, jobs(title)')
        .eq('reviewed_id', contractorId)
        .order('created_at', { ascending: false })
      
      if (reviewsData) {
        setReviews(reviewsData)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!contractor) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p>Contractor not found</p>
        <Link href="/feed" className="text-blue-600 underline">Back to Feed</Link>
      </div>
    )
  }

  // Parse external reviews
  const reviewLinks = contractor.external_reviews 
    ? contractor.external_reviews.split('\n').filter((r: string) => r.trim())
    : []
    
  // Get ratings from other contractors/homeowners
  useEffect(() => {
    const fetchRatings = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, users!inner(first_name, last_name)')
        .eq('reviewed_id', contractor.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setRatings(data)
    }
    if (contractor.id) fetchRatings()
  }, [contractor.id])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-[#0F172A]">← Back to Feed</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/feed" className="text-[#0F172A]">Feed</Link>
            <Link href="/contractors" className="text-[#0F172A]">Contractors</Link>
            <Link href="/community" className="text-[#0F172A]">Community</Link>
            <Link href="/jobs/post" className="text-[#0F172A]">Post</Link>
            <Link href="/messages" className="text-[#0F172A]">Messages</Link>
            <Link href="/profile" className="text-[#0F172A]">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold">
              {contractor.first_name?.[0]}{contractor.last_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {contractor.first_name} {contractor.last_name}
                </h1>
                {contractor.is_verified && (
                  <span className="bg-[#10B981]/10 text-[#10B981] text-xs px-2 py-1 rounded">✓ Verified</span>
                )}
              </div>
              <p className="text-[#0F172A]">{contractor.company_name || 'Individual Contractor'}</p>
              <p className="text-sm text-[#0F172A]">{contractor.trade_type?.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Verification Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {contractor.is_verified && (
              <span className="bg-[#3B82F6]/10 text-[#3B82F6] text-xs px-3 py-1 rounded-full font-medium">✓ Verified</span>
            )}
            {contractor.is_insured && (
              <span className="bg-[#10B981]/10 text-[#10B981] text-xs px-3 py-1 rounded-full font-medium">🛡️ Insured</span>
            )}
            <span className="bg-[#F97316]/10 text-[#F97316] text-xs px-3 py-1 rounded-full font-medium">📋 W-9</span>
            {reviewLinks.length > 0 && (
              <span className="bg-[#F59E0B]/10 text-[#F59E0B] text-xs px-3 py-1 rounded-full font-medium">⭐ External Reviews</span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{contractor.avg_rating || contractor.jobs_completed || 0}</p>
              <p className="text-xs text-[#0F172A]">Rating</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{contractor.review_count || reviews.length}</p>
              <p className="text-xs text-[#0F172A]">Reviews</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{contractor.jobs_completed || 0}</p>
              <p className="text-xs text-[#0F172A]">Jobs Done</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{contractor.years_experience || 0}</p>
              <p className="text-xs text-[#0F172A]">Years</p>
            </div>
          </div>

          {contractor.bio && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">About</h3>
              <p className="text-[#0F172A]">{contractor.bio}</p>
            </div>
          )}

          {/* Service Area */}
          {contractor.service_counties && contractor.service_counties.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Service Area</h3>
              <div className="flex flex-wrap gap-2">
                {contractor.service_counties.map((county, i) => (
                  <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{county}</span>
                ))}
              </div>
            </div>
          )}

          {/* Platform Ratings & Reviews */}
          {ratings && ratings.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">TradeSource Reviews ({ratings.length})</h3>
              <div className="space-y-3">
                {ratings.map((review: any) => (
                  <div key={review.id} className={`p-3 rounded-xl ${review.is_issue ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.users?.first_name}</span>
                        {review.is_issue && (
                          <span className="text-xs bg-[#EF4444]/10 text-[#EF4444] px-2 py-0.5 rounded">⚠️ Issue Reported</span>
                        )}
                      </div>
                      <div className="flex">
                        {[1,2,3,4,5].map((star) => (
                          <span key={star} className={star <= review.rating ? 'text-yellow-500' : 'text-[#64748B]300'}>⭐</span>
                        ))}
                      </div>
                    </div>
                    {review.feedback && (
                      <p className="text-sm text-[#64748B]600">{review.feedback}</p>
                    )}
                    {review.is_issue && review.issue_type && (
                      <p className="text-xs text-red-600 mt-1">
                        Issue: {review.issue_type.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Reviews */}
          {reviewLinks.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">External Reviews</h3>
              <div className="space-y-2">
                {reviewLinks.map((link: string, i: number) => (
                  <a 
                    key={i} 
                    href={link.trim()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <span>{link.includes('google') ? '🔍' : link.includes('yelp') ? '⭐' : '📘'}</span>
                      <span>{link.includes('google') ? 'Google' : link.includes('yelp') ? 'Yelp' : 'Review'}</span>
                    </span>
                    <span>View →</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Portfolio */}
        {contractor.portfolio_urls && contractor.portfolio_urls.length > 0 && (
          <div className="border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
            <div className="grid grid-cols-2 gap-3">
              {contractor.portfolio_urls.slice(0, 6).map((url, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link 
            href={`/messages?contractor=${contractor.id}`}
            className="flex-1 bg-[#0F172A] text-white py-3 rounded-xl text-center font-medium"
          >
            Message
          </Link>
        </div>
      </main>
    </div>
  )
}
