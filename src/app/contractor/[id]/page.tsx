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

  useEffect(() => {
    fetchContractor()
  }, [])

  const fetchContractor = async () => {
    const contractorId = params.id as string
    
    // Fetch contractor info
    const { data: contractorData } = await supabase
      .from('users')
      .select('*')
      .eq('id', contractorId)
      .single()
    
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
    return <div className="min-h-screen flex items-center justify-center">Contractor not found</div>
  }

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'New'

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold">← Back to Feed</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="border rounded-xl p-6 mb-6">
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
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">✓ Verified</span>
                )}
              </div>
              <p className="text-black">{contractor.company_name || 'Individual Contractor'}</p>
              <p className="text-sm text-black">{contractor.trade_type?.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Verification Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {contractor.is_verified && (
              <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">✓ Verified</span>
            )}
            {contractor.is_insured && (
              <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">🛡️ Insured</span>
            )}
            {contractor.external_reviews && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">⭐ External Reviews</span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{contractor.avg_rating || contractor.jobs_completed || 0}</p>
              <p className="text-xs text-black">Rating</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{contractor.review_count || reviews.length}</p>
              <p className="text-xs text-black">Reviews</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{contractor.jobs_completed || 0}</p>
              <p className="text-xs text-black">Jobs Done</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{contractor.years_experience || 0}</p>
              <p className="text-xs text-black">Years</p>
            </div>
          </div>

          {contractor.bio && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">About</h3>
              <p className="text-black">{contractor.bio}</p>
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

          {/* External Reviews */}
          {contractor.external_reviews && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Reviews</h3>
              <div className="space-y-2">
                {JSON.parse(contractor.external_reviews).map((review: any, i: number) => (
                  <a 
                    key={i} 
                    href={review.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <span>{review.platform === 'google' ? '🔍' : review.platform === 'yelp' ? '⭐' : '📘'}</span>
                      <span className="capitalize">{review.platform}</span>
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
          <div className="border rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
            <div className="grid grid-cols-2 gap-3">
              {contractor.portfolio_urls.slice(0, 6).map((url, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
            className="flex-1 bg-slate-900 text-white py-3 rounded-lg text-center font-medium"
          >
            Message
          </Link>
          <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium">
            Hire Now
          </button>
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Reviews ({reviews.length})</h2>
          
          {reviews.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl">
              <p className="text-black">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-black'}>★</span>
                      ))}
                    </div>
                    <span className="text-sm text-black">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-black">{review.review_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
