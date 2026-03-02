'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export const dynamic = 'force-dynamic'

export default function PostJob() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
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
        is_b2c: true,
        square_footage: formData.squareFootage ? parseInt(formData.squareFootage) : null,
        timeline: formData.timeline,
        job_scope: formData.jobScope,
        status: 'OPEN',
        media_urls: formData.mediaUrls,
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="max-w-2xl mx-auto px-3 md:px-6 py-4 md:py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xl md:text-2xl md:text-3xl font-bold text-gray-900">Post a Project</h1>
          <p className="text-gray-500 mt-2">Get quotes from verified contractors</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-gray-900/5 border border-gray-100 p-4 md:p-8">
          
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
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 md:p-6 text-center hover:border-blue-400 transition-colors">
              <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 mb-1 text-sm">Photos & Videos</p>
              <p className="text-xs text-gray-400 mb-4">JPG, PNG, MP4 up to 50MB</p>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {/* Camera Capture */}
                <label htmlFor="camera-capture" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm cursor-pointer hover:bg-green-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                </label>
                <input
                  type="file"
                  capture="environment"
                  accept="image/*,video/*"
                  className="hidden"
                  id="camera-capture"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    setUploading(true)
                    try {
                      const fileName = `${Date.now()}-${file.name}`
                      const { data, error } = await supabase.storage.from('job-media').upload(fileName, file)
                      
                      if (!error && data) {
                        const { data: urlData } = supabase.storage.from('job-media').getPublicUrl(fileName)
                        if (urlData?.publicUrl) {
                          setFormData(prev => ({ ...prev, mediaUrls: [...prev.mediaUrls, urlData.publicUrl] }))
                        }
                      }
                    } catch (err) {
                      console.error('Error uploading:', err)
                    }
                    setUploading(false)
                    e.target.value = ''
                  }}
                />

                {/* Browse Files */}
                <label htmlFor="media-upload" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm cursor-pointer hover:bg-blue-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {uploading ? 'Uploading...' : 'Browse'}
                </label>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                id="media-upload"
                onChange={async (e) => {
                  const files = e.target.files
                  if (!files || files.length === 0) return
                  
                  setUploading(true)
                  const uploadedUrls: string[] = []
                  
                  for (const file of Array.from(files)) {
                    try {
                      const fileName = `${Date.now()}-${file.name}`
                      const { data, error } = await supabase.storage
                        .from('job-media')
                        .upload(fileName, file)
                      
                      if (error) {
                        console.error('Upload error:', error)
                        continue
                      }
                      
                      // Get public URL
                      const { data: urlData } = supabase.storage
                        .from('job-media')
                        .getPublicUrl(fileName)
                      
                      if (urlData.publicUrl) {
                        uploadedUrls.push(urlData.publicUrl)
                      }
                    } catch (err) {
                      console.error('Error uploading file:', err)
                    }
                  }
                  
                  if (uploadedUrls.length > 0) {
                    setFormData({
                      ...formData, 
                      mediaUrls: [...formData.mediaUrls, ...uploadedUrls]
                    })
                  }
                  
                  setUploading(false)
                }}
              />
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
      <BottomNav />
    </div>
  )
}
