'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function PostJob() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  const [formData, setFormData] = useState({
    isB2C: true,
    title: '',
    description: '',
    county: '',
    address: '',
    city: '',
    zip: '',
    workCategory: 'INTERIOR',
    priceType: 'FIXED',
    priceAmount: '',
    squareFootage: '',
    timeline: 'FLEXIBLE',
    jobScope: '',
    mediaUrls: [] as string[],
  })

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

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    setUserProfile(profile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!user) throw new Error('Not authenticated')

      const jobData = {
        posted_by: user.id,
        title: formData.title,
        description: formData.description,
        county: formData.county,
        address: formData.address,
        city: formData.city,
        zip: formData.zip,
        state: 'PA',
        work_category: formData.workCategory,
        job_type: 'B2C_PROJECT',
        price_type: formData.priceType,
        price_amount: parseInt(formData.priceAmount) || 0,
        is_b2c: formData.isB2C,
        square_footage: formData.squareFootage ? parseInt(formData.squareFootage) : null,
        timeline: formData.timeline,
        job_scope: formData.jobScope,
        status: 'OPEN',
      }

      const { error: insertError } = await supabase.from('jobs').insert(jobData)

      if (insertError) throw insertError

      router.push('/feed')
    } catch (err: any) {
      setError(err.message || 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  const workCategories = [
    { value: 'INTERIOR', label: 'Interior Painting' },
    { value: 'EXTERIOR', label: 'Exterior Painting' },
  ]

  const counties = [
    'Montgomery',
    'Bucks',
    'Philadelphia',
    'Delaware',
    'Chester',
    'Lehigh',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-gray-900">
            Trade<span className="text-blue-600">Source</span>
          </Link>
          <nav className="flex gap-6 items-center text-sm">
            <Link href="/feed" className="text-gray-600 hover:text-gray-900">Feed</Link>
            <Link href="/contractors" className="text-gray-600 hover:text-gray-900">Contractors</Link>
            <Link href="/community" className="text-gray-600 hover:text-gray-900">Community</Link>
            <Link href="/jobs/post" className="font-semibold text-gray-900">Post</Link>
            <Link href="/messages" className="text-gray-600 hover:text-gray-900">Messages</Link>
            <Link href="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Post a Project</h1>
          <p className="text-gray-500 mt-2">Get quotes from verified contractors</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 border border-gray-100 p-8">
          
          {/* Section: Basic Info */}
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
              <input
                type="text"
                required
                placeholder="e.g., Interior painting for living room"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                required
                rows={4}
                placeholder="Describe the work needed..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Type *</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.workCategory}
                  onChange={e => setFormData({...formData, workCategory: e.target.value})}
                >
                  {workCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.timeline}
                  onChange={e => setFormData({...formData, timeline: e.target.value})}
                >
                  <option value="ASAP">ASAP</option>
                  <option value="WITHIN_MONTH">Within a month</option>
                  <option value="FLEXIBLE">Flexible</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Location */}
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">County *</label>
              <select
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.county}
                onChange={e => setFormData({...formData, county: e.target.value})}
              >
                <option value="">Select county</option>
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  placeholder="Philadelphia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.zip}
                  onChange={e => setFormData({...formData, zip: e.target.value})}
                  placeholder="19000"
                />
              </div>
            </div>
          </div>

          {/* Section: Budget */}
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Budget</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Type</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.priceType}
                  onChange={e => setFormData({...formData, priceType: e.target.value})}
                >
                  <option value="FIXED">Fixed Price</option>
                  <option value="HOURLY">Hourly Rate</option>
                  <option value="NEGOTIABLE">Negotiable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.priceAmount}
                  onChange={e => setFormData({...formData, priceAmount: e.target.value})}
                  placeholder="5000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Square Footage (optional)</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.squareFootage}
                onChange={e => setFormData({...formData, squareFootage: e.target.value})}
                placeholder="2000"
              />
            </div>
          </div>

          {/* Section: Photos & Videos */}
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Photos & Videos</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 mb-2">Drag and drop photos or videos here</p>
              <p className="text-sm text-gray-400">JPG, PNG, MP4 up to 50MB</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                id="media-upload"
                onChange={async (e) => {
                  const files = e.target.files
                  if (!files) return
                  
                  // For MVP, just store the file names/URLs
                  // In production, you'd upload to Supabase Storage
                  const urls = Array.from(files).map(f => f.name)
                  setFormData({...formData, mediaUrls: [...formData.mediaUrls, ...urls]})
                }}
              />
              <label htmlFor="media-upload" className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
                Browse Files
              </label>
            </div>

            {/* Uploaded Files Preview */}
            {formData.mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.mediaUrls.map((url, i) => (
                  <div key={i} className="relative bg-gray-100 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <span>📎</span>
                    <span className="truncate max-w-[150px]">{url}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        mediaUrls: formData.mediaUrls.filter((_, idx) => idx !== i)
                      })}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/25"
          >
            {loading ? 'Posting...' : 'Post Project'}
          </button>
        </form>
      </main>
    </div>
  )
}
