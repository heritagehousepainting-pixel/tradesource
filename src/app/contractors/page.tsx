'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Contractor {
  id: string
  first_name: string
  last_name: string
  company_name: string
  trade_type: string
  bio: string
  service_counties: string[]
  is_verified: boolean
  is_insured: boolean
  years_experience: number
  jobs_completed: number
  avg_rating: number
  review_count: number
  portfolio_urls: string[]
  external_reviews: string
}

export default function Contractors() {
  const router = useRouter()
  const supabase = createClient()
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [countyFilter, setCountyFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadContractors()
  }, [countyFilter, verifiedFilter])

  const loadContractors = async () => {
    setLoading(true)
    
    let query = supabase
      .from('users')
      .select('*')
      .eq('user_type', 'CONTRACTOR')
      .eq('verification_status', 'APPROVED')
      .order('avg_rating', { ascending: false })

    if (countyFilter !== 'all') {
      query = query.contains('service_counties', [countyFilter])
    }

    const { data } = await query

    if (data) {
      let filtered = data
      
      if (verifiedFilter === 'verified') {
        filtered = filtered.filter((c: any) => c.is_verified)
      } else if (verifiedFilter === 'insured') {
        filtered = filtered.filter((c: any) => c.is_insured)
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter((c: any) => 
          c.company_name?.toLowerCase().includes(q) ||
          c.first_name?.toLowerCase().includes(q) ||
          c.last_name?.toLowerCase().includes(q) ||
          c.bio?.toLowerCase().includes(q)
        )
      }

      setContractors(filtered)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-gray-900">TradeSource</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed" className="text-gray-900">Feed</Link>
            <Link href="/community" className="text-gray-900">Community</Link>
            <Link href="/jobs/post" className="text-gray-900">Post</Link>
            <Link href="/messages" className="text-gray-900">Messages</Link>
            <Link href="/profile" className="text-gray-900">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find Contractors</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <select 
            className="px-3 py-2 border border-gray-200 rounded-2xl"
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
            className="px-3 py-2 border border-gray-200 rounded-2xl"
            value={verifiedFilter}
            onChange={e => setVerifiedFilter(e.target.value)}
          >
            <option value="all">All Contractors</option>
            <option value="verified">Verified Only</option>
            <option value="insured">Insured Only</option>
          </select>

          <input
            type="text"
            placeholder="Search contractors..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-2xl flex-1 min-w-[200px]"
          />
        </div>

        {/* Contractor Count */}
        <p className="text-sm text-gray-500500 mb-4">
          {contractors.length} verified contractor{contractors.length !== 1 ? 's' : ''} found
        </p>

        {/* Contractor Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : contractors.length === 0 ? (
          <div className="text-center py-12 text-gray-500500">
            No contractors found. Try adjusting your filters.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractors.map((contractor) => (
              <Link
                key={contractor.id}
                href={`/contractor/${contractor.id}`}
                className="border border-gray-200 rounded-2xl p-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 transition"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500600">
                    {contractor.first_name?.[0]}{contractor.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {contractor.company_name || `${contractor.first_name} ${contractor.last_name}`}
                    </h3>
                    <p className="text-sm text-gray-500500">{contractor.trade_type}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2 mb-3">
                  {contractor.is_verified && (
                    <span className="bg-[#3B82F6]/10 text-[#3B82F6] text-xs px-2 py-1 rounded-full">✓ Verified</span>
                  )}
                  {contractor.is_insured && (
                    <span className="bg-[#10B981]/10 text-[#10B981] text-xs px-2 py-1 rounded-full">🛡️ Insured</span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-gray-50 rounded-2xl p-2">
                    <p className="font-bold text-gray-900">{contractor.avg_rating || 0}</p>
                    <p className="text-xs text-gray-500500">Rating</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-2">
                    <p className="font-bold text-gray-900">{contractor.jobs_completed || 0}</p>
                    <p className="text-xs text-gray-500500">Jobs</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-2">
                    <p className="font-bold text-gray-900">{contractor.years_experience || 0}</p>
                    <p className="text-xs text-gray-500500">Years</p>
                  </div>
                </div>

                {/* Bio */}
                {contractor.bio && (
                  <p className="text-sm text-gray-500600 line-clamp-2">{contractor.bio}</p>
                )}

                {/* Service Area */}
                {contractor.service_counties && contractor.service_counties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {contractor.service_counties.map((county, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{county}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
