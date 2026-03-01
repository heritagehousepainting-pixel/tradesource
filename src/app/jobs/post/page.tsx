'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function PostJob() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    county: '',
    address: '',
    city: '',
    zip: '',
    squareFootage: '',
    timeline: 'FLEXIBLE',
    jobType: 'FULL',
    workCategory: 'INTERIOR',
    jobScope: '',
    priceType: 'FIXED',
    priceAmount: '',
    isB2C: false,
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
    
    // Get user profile for subscription check
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      setUserProfile(profile)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newUrls: string[] = []
    const newPreviews: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Create preview
      const reader = new FileReader()
      const previewPromise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const preview = await previewPromise
      newPreviews.push(preview)

      // Upload to Supabase Storage
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
      
      if (urlData?.publicUrl) {
        newUrls.push(urlData.publicUrl)
      }
    }

    setMediaUrls([...mediaUrls, ...newUrls])
    setPreviews([...previews, ...newPreviews])
    setUploading(false)
  }

  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Skip subscription limits for MVP - all users can post

    try {
      const { data: jobData, error: insertError } = await supabase.from('jobs').insert({
        posted_by: user.id,
        title: formData.title,
        description: formData.description,
        county: formData.county,
        address: formData.address,
        city: formData.city,
        state: 'PA',
        zip: formData.zip,
        square_footage: formData.squareFootage ? parseInt(formData.squareFootage) : null,
        timeline: formData.timeline,
        job_scope: formData.jobScope || null,
        job_type: formData.isB2C ? 'B2C_PROJECT' : formData.jobType,
        work_category: formData.workCategory,
        price_type: formData.priceType,
        price_amount: parseFloat(formData.priceAmount) || 0,
        is_b2c: formData.isB2C,
        status: 'OPEN',
        media_urls: mediaUrls,
      }).select().single()

      if (insertError) throw insertError

      // Log job posting
      await supabase.from('job_history').insert({
        user_id: user.id,
        job_id: jobData.id,
        action: 'POSTED'
      })

      router.push('/feed')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-black">TradeSource</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/feed" className="text-black">Feed</Link>
            <Link href="/contractors" className="text-black">Contractors</Link>
            <Link href="/community" className="text-black">Community</Link>
            <Link href="/jobs/post" className="text-black">Post</Link>
            <Link href="/messages" className="text-black">Messages</Link>
            <Link href="/profile" className="text-black">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* B2C Toggle */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="isB2C"
              className="w-5 h-5"
              checked={formData.isB2C}
              onChange={e => setFormData({...formData, isB2C: e.target.checked})}
            />
            <label htmlFor="isB2C" className="font-medium">
              This is a homeowner project (free posting)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Interior painting for 3-bedroom house"
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Provide details about the job..."
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">County *</label>
              <select
                required
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.county}
                onChange={e => setFormData({...formData, county: e.target.value})}
              >
                <option value="">Select county</option>
                <option value="Montgomery">Montgomery</option>
                <option value="Bucks">Bucks</option>
                <option value="Philadelphia">Philadelphia</option>
                <option value="Delaware">Delaware</option>
              </select>
            </div>

            {/* Address Fields */}
            <div>
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  placeholder="Philadelphia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.zip}
                  onChange={e => setFormData({...formData, zip: e.target.value})}
                  placeholder="19000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Square Footage (optional)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.squareFootage}
                  onChange={e => setFormData({...formData, squareFootage: e.target.value})}
                  placeholder="2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timeline</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.timeline}
                  onChange={e => setFormData({...formData, timeline: e.target.value})}
                >
                  <option value="ASAP">ASAP</option>
                  <option value="THIS_WEEK">This Week</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="FLEXIBLE">Flexible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Work Category</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.workCategory}
                onChange={e => setFormData({...formData, workCategory: e.target.value})}
              >
                <option value="INTERIOR">Interior</option>
                <option value="EXTERIOR">Exterior</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
          </div>

          {!formData.isB2C && (
            <div>
              <label className="block text-sm font-medium mb-1">Scope of Work (for GCs)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                value={formData.jobScope}
                onChange={e => setFormData({...formData, jobScope: e.target.value})}
                placeholder="Describe the scope of work for subcontractors..."
              />
            </div>
          )}

          {!formData.isB2C && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.jobType}
                  onChange={e => setFormData({...formData, jobType: e.target.value})}
                >
                  <option value="FULL">Full Job</option>
                  <option value="PIECE">Piece Work</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.priceType}
                  onChange={e => setFormData({...formData, priceType: e.target.value})}
                >
                  <option value="FIXED">Fixed Price</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>
            </div>
          )}

          {!formData.isB2C && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Price {formData.priceType === 'HOURLY' ? '(per hour)' : ''}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black">$</span>
                <input
                  type="number"
                  required
                  className="w-full pl-7 pr-3 py-2 border rounded-lg"
                  placeholder="0.00"
                  value={formData.priceAmount}
                  onChange={e => setFormData({...formData, priceAmount: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Photos/Videos Section */}
          <div>
            <label className="block text-sm font-medium mb-2">Photos & Videos</label>
            <p className="text-sm text-gray-500 mb-2">Add photos or videos of the job (optional)</p>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition"
            >
              {uploading ? (
                <span>Uploading...</span>
              ) : (
                <span className="text-gray-500">
                  📷 Click to upload photos or videos
                </span>
              )}
            </button>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    {preview.startsWith('data:video') ? (
                      <video src={preview} className="w-full h-full object-cover rounded" />
                    ) : (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover rounded" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </main>
    </div>
  )
}
