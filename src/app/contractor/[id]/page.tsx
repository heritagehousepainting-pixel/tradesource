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
  is_verified: boolean
  bio: string
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
              <p className="text-slate-500">{contractor.company_name || 'Individual Contractor'}</p>
              <p className="text-sm text-slate-500">{contractor.trade_type?.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{avgRating}</p>
              <p className="text-sm text-slate-500">⭐ Rating</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{reviews.length}</p>
              <p className="text-sm text-slate-500">Reviews</p>
            </div>
          </div>

          {contractor.bio && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">About</h3>
              <p className="text-slate-600">{contractor.bio}</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Reviews ({reviews.length})</h2>
          
          {reviews.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl">
              <p className="text-slate-500">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-slate-200'}>★</span>
                      ))}
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600">{review.review_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
