'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface UserProfile {
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
  is_background_checked: boolean
  license_number: string
  license_verified: boolean
  insurance_provider: string
  insurance_expiry: string
  insurance_verified: boolean
  background_check_status: string
  years_experience: number
  profile_photo_url: string
  external_reviews: string
  external_rating: number
  external_review_count: number
  portfolio_urls: string[]
  review_count: number
  avg_rating: number
  jobs_completed: number
  verification_status: string
  verification_notes: string
  subscription_tier: string
  subscription_status: string
  availability: boolean
  bio: string
}

// Badge component
function Badge({ type, label, verified }: { type: 'verified' | 'insured' | 'tax' | 'reviews'; label: string; verified: boolean }) {
  const colors = {
    verified: 'bg-[#3B82F6]/10 text-[#3B82F6] border-blue-300',
    insured: 'bg-[#10B981]/10 text-[#10B981] border-green-300',
    tax: 'bg-[#F97316]/10 text-[#F97316] border-orange-300',
    reviews: 'bg-[#F59E0B]/10 text-[#F59E0B] border-yellow-300',
  }
  const icons = {
    verified: '✓',
    insured: '🛡️',
    tax: '📋',
    reviews: '⭐',
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colors[type]} ${verified ? '' : 'opacity-50'}`}>
      <span className="text-lg">{icons[type]}</span>
      <span className="font-medium">{label}</span>
      {verified && <span className="text-xs">✓</span>}
    </div>
  )
}

// FIXED Verification Section - Single submission for all 4 docs
function VerificationSection({ profile, externalReviews, onUpdate }: { profile: UserProfile; externalReviews?: string; onUpdate: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Text inputs
    paLicenseNumber: '',
    insuranceProvider: '',
    insuranceExpiry: '',
    reviewLinks: '',
    workmenCompProvider: '',
    workmenCompExpiry: '',
    
    // File uploads
    driverLicense: null as File | null,
    paLicenseCert: null as File | null,
    insuranceCert: null as File | null,
    w9Form: null as File | null,
    workmenCompCert: null as File | null,
  })
  
  // Additional review links (bonus)
  const [extraReviewLinks, setExtraReviewLinks] = useState<string[]>([])
  const supabase = createClient()

  // Initialize extra review links from props
  useEffect(() => {
    if (externalReviews) {
      const reviewArray = externalReviews.split('\n').filter(r => r.trim())
      const extraLinks = reviewArray.slice(1) || []
      setExtraReviewLinks(extraLinks)
      // Set the first review link as the required one
      if (reviewArray[0]) {
        setFormData(prev => ({ ...prev, reviewLinks: reviewArray[0] }))
      }
    }
  }, [externalReviews])

  // Check completion status (now includes Workmen's Comp)
  const allFieldsComplete = 
    formData.paLicenseNumber.trim() !== '' &&
    formData.insuranceProvider.trim() !== '' &&
    formData.insuranceExpiry.trim() !== '' &&
    formData.workmenCompProvider.trim() !== '' &&
    formData.workmenCompExpiry.trim() !== '' &&
    formData.reviewLinks.trim() !== '' &&
    formData.driverLicense !== null &&
    formData.paLicenseCert !== null &&
    formData.insuranceCert !== null &&
    formData.workmenCompCert !== null &&
    formData.w9Form !== null

  // Count completed items for progress bar
  const completedCount = [
    formData.driverLicense !== null,
    formData.paLicenseNumber.trim() !== '' && formData.paLicenseCert !== null,
    formData.insuranceProvider.trim() !== '' && formData.insuranceExpiry.trim() !== '' && formData.insuranceCert !== null,
    formData.workmenCompProvider.trim() !== '' && formData.workmenCompExpiry.trim() !== '' && formData.workmenCompCert !== null,
    formData.w9Form !== null,
    formData.reviewLinks.trim() !== ''
  ].filter(Boolean).length

  const handleFileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, [field]: e.target.files![0] }))
    }
  }

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('verification-docs')
      .upload(path, file)
    
    if (error) throw error
    return data.path
  }

  const handleSubmitAll = async () => {
    if (!allFieldsComplete) {
      alert('Please complete all 4 verification requirements before submitting.')
      return
    }

    setSubmitting(true)
    
    try {
      setSubmitting(true)
      
      // Upload all files one by one to catch specific errors
      const timestamp = Date.now()
      const userId = profile.id
      
      let driverLicensePath = ''
      let paLicensePath = ''
      let insurancePath = ''
      let w9Path = ''
      let workmenCompPath = ''
      
      try {
        driverLicensePath = await uploadFile(formData.driverLicense!, `${userId}/driver-license-${timestamp}.pdf`)
      } catch (e: any) { throw new Error(`Driver License upload failed: ${e.message}`) }
      
      try {
        paLicensePath = await uploadFile(formData.paLicenseCert!, `${userId}/pa-license-${timestamp}.pdf`)
      } catch (e: any) { throw new Error(`PA License upload failed: ${e.message}`) }
      
      try {
        insurancePath = await uploadFile(formData.insuranceCert!, `${userId}/insurance-${timestamp}.pdf`)
      } catch (e: any) { throw new Error(`Insurance upload failed: ${e.message}`) }
      
      try {
        w9Path = await uploadFile(formData.w9Form!, `${userId}/w9-${timestamp}.pdf`)
      } catch (e: any) { throw new Error(`W-9 upload failed: ${e.message}`) }
      
      try {
        workmenCompPath = await uploadFile(formData.workmenCompCert!, `${userId}/workmen-comp-${timestamp}.pdf`)
      } catch (e: any) { throw new Error(`Workmen's Comp upload failed: ${e.message}`) }

      // Combine all review links (required + extra)
      const allReviewLinks = [
        formData.reviewLinks,
        ...extraReviewLinks.filter(link => link.trim() !== '')
      ].filter(link => link.trim() !== '').join('\n')

      // Submit all verification data at once
      const { error } = await supabase
        .from('users')
        .update({
          verification_status: 'PENDING',
          license_number: formData.paLicenseNumber,
          insurance_provider: formData.insuranceProvider,
          insurance_expiry: formData.insuranceExpiry,
          external_reviews: allReviewLinks,
          // Store Workmen's Comp info
          workmen_comp_provider: formData.workmenCompProvider,
          workmen_comp_expiry: formData.workmenCompExpiry,
          // Store file paths in verification_documents JSON field
          verification_documents: JSON.stringify({
            driver_license: driverLicensePath,
            pa_license: paLicensePath,
            insurance_cert: insurancePath,
            w9_form: w9Path,
            workmen_comp_cert: workmenCompPath,
            submitted_at: new Date().toISOString()
          })
        })
        .eq('id', profile.id)

      if (!error) {
        alert('✅ All verification documents submitted successfully! You will be notified once reviewed.')
        onUpdate()
      } else {
        throw error
      }
      
    } catch (error: any) {
      console.error('Submission error:', error)
      // Show more detailed error
      if (error.message?.includes('400')) {
        alert(`Upload failed. Please try again. If this keeps happening, try logging out and back in.`)
      } else {
        alert(`Error: ${error.message}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Check verification status
  const isFullyVerified = profile.verification_status === 'APPROVED'
  const showPending = profile.verification_status === 'PENDING'
  const showRejected = profile.verification_status === 'REJECTED'

  // If fully verified, show success
  if (isFullyVerified) {
    return (
      <div className="border border-gray-200 rounded-xl p-6 bg-green-50 border-green-200">
        <h2 className="text-xl font-bold mb-4 text-green-800">✅ Verification Complete</h2>
        <p className="text-[#10B981]">Congratulations! You're fully verified and have full access to:</p>
        <ul className="mt-2 text-[#10B981] text-sm">
          <li>• View all job prices</li>
          <li>• Post jobs to the network</li>
          <li>• Express interest on jobs</li>
          <li>• Full messaging capabilities</li>
        </ul>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">📋 Verification Requirements</h2>
      <p className="text-sm mb-6 text-[#64748B]600">
        Complete all 6 requirements and submit together for admin review. No partial submissions allowed.
      </p>

      {/* Status Messages */}
      {showPending && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
          <p className="text-yellow-800 font-medium">⏳ Under Review</p>
          <p className="text-sm text-[#F59E0B]">Your verification is being processed. You'll receive email notification once approved.</p>
        </div>
      )}

      {showRejected && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
          <p className="text-red-800 font-medium">❌ Verification Rejected</p>
          <p className="text-sm text-[#EF4444] mb-2">
            <strong>Admin Feedback:</strong> {profile.verification_notes || 'Please review and correct the issues below.'}
          </p>
          <p className="text-sm text-[#EF4444]">Fix the issues and resubmit all documents.</p>
        </div>
      )}

      {/* Verification Form - Only show if not pending */}
      {!showPending && (
        <div className="space-y-6">
          {/* Requirement 1: Driver's License */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              🪪 1. Driver's License
              {formData.driverLicense && <span className="text-green-600 text-sm">✓ Uploaded</span>}
            </h3>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange('driverLicense')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <p className="text-xs text-[#64748B]500 mt-1">Upload clear photo of your driver's license (PDF, JPG, PNG)</p>
          </div>

          {/* Requirement 2: PA License + Certificate */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              🏢 2. Pennsylvania HIC License
              {formData.paLicenseNumber && formData.paLicenseCert && <span className="text-green-600 text-sm">✓ Complete</span>}
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter your PA HIC License Number"
                value={formData.paLicenseNumber}
                onChange={e => setFormData({ ...formData, paLicenseNumber: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
              />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange('paLicenseCert')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <p className="text-xs text-[#64748B]500">Upload your PA HIC license certificate</p>
            </div>
          </div>

          {/* Requirement 3: General Liability Insurance */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              🛡️ 3. General Liability Insurance ($1M+ Required)
              {formData.insuranceProvider && formData.insuranceExpiry && formData.insuranceCert && <span className="text-green-600 text-sm">✓ Complete</span>}
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Insurance Company Name"
                value={formData.insuranceProvider}
                onChange={e => setFormData({ ...formData, insuranceProvider: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
              />
              <div>
                <label className="block text-xs font-medium mb-1 text-[#64748B]600">Policy Expiration Date</label>
                <input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange('insuranceCert')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <p className="text-xs text-[#64748B]500">Upload Certificate of Insurance showing $1M+ liability coverage</p>
            </div>
          </div>

          {/* Requirement 4: Workmen's Comp Insurance */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              👷 4. Workmen's Compensation Insurance (Required)
              {formData.workmenCompProvider && formData.workmenCompExpiry && formData.workmenCompCert && <span className="text-green-600 text-sm">✓ Complete</span>}
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Workmen's Comp Insurance Company Name"
                value={formData.workmenCompProvider || ''}
                onChange={e => setFormData({ ...formData, workmenCompProvider: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
              />
              <div>
                <label className="block text-xs font-medium mb-1 text-[#64748B]600">Policy Expiration Date</label>
                <input
                  type="date"
                  value={formData.workmenCompExpiry || ''}
                  onChange={e => setFormData({ ...formData, workmenCompExpiry: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange('workmenCompCert')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <p className="text-xs text-[#64748B]500">Upload Workmen's Compensation Certificate (Required for all contractors with employees)</p>
            </div>
          </div>

          {/* Requirement 5: W-9 Tax Form */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              📋 5. W-9 Tax Form
              {formData.w9Form && <span className="text-green-600 text-sm">✓ Uploaded</span>}
            </h3>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange('w9Form')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <p className="text-xs text-[#64748B]500 mt-1">
              Upload completed W-9 form. <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" target="_blank" className="text-blue-600 underline">Download blank W-9 here</a>
            </p>
          </div>

          {/* External Reviews - REQUIRED */}
          <div className="border border-gray-200 rounded-xl p-4 bg-yellow-50 border-yellow-300">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              ⭐ 6. External Reviews (Required)
              {formData.reviewLinks.trim() !== '' && <span className="text-green-600 text-sm">✓ Added</span>}
            </h3>
            <input
              type="url"
              placeholder="Paste your Google, Yelp, or Facebook review link (required)"
              value={formData.reviewLinks}
              onChange={e => setFormData({ ...formData, reviewLinks: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 mb-2"
            />
            
            {/* Extra Review Links (Bonus - Add More) */}
            {extraReviewLinks.map((link, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  placeholder="Additional review link (optional)"
                  value={link}
                  onChange={e => {
                    const newLinks = [...extraReviewLinks]
                    newLinks[index] = e.target.value
                    setExtraReviewLinks(newLinks)
                  }}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => setExtraReviewLinks(extraReviewLinks.filter((_, i) => i !== index))}
                  className="text-red-500 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => setExtraReviewLinks([...extraReviewLinks, ''])}
              className="text-blue-600 text-sm underline"
            >
              + Add another review link
            </button>
            
            <p className="text-xs text-[#64748B]500 mt-2">Required: At least one review link. More links = bonus!</p>
          </div>

          {/* Progress Indicator */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Completion Progress</span>
              <span className="text-sm">
                {completedCount} / 6 Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ 
                  width: `${(completedCount / 6) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitAll}
            disabled={submitting || !allFieldsComplete}
            className={`w-full py-3 rounded-xl font-medium transition-all ${
              allFieldsComplete && !submitting
                ? 'bg-[#0F172A] text-white hover:bg-[#1E293B]' 
                : 'bg-gray-300 text-[#64748B]500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Uploading Documents...
              </span>
            ) : allFieldsComplete ? (
              '🚀 Submit All for Verification'
            ) : (
              `Complete All 6 Requirements First (${completedCount}/6)`
            )}
          </button>

          <p className="text-xs text-center text-[#64748B]500">
            All documents will be reviewed by our admin team within 24-48 hours.
          </p>
        </div>
      )}
    </div>
  )
}

// Job History component
function JobHistorySection({ userId }: { userId: string }) {
  const [history, setHistory] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchHistory = async () => {
      console.log('Fetching job history for user:', userId)
      // Get all history for this user
      const { data, error } = await supabase
        .from('job_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (data && data.length > 0) {
        // Group by job_id and keep only the latest action per job
        const latestByJob: Record<string, any> = {}
        for (const item of data) {
          if (!latestByJob[item.job_id]) {
            latestByJob[item.job_id] = item
          }
        }
        // Convert back to array and limit to 10
        const uniqueHistory = Object.values(latestByJob).slice(0, 10)
        setHistory(uniqueHistory)
        console.log('Job history (deduplicated):', uniqueHistory)
      } else {
        setHistory([])
      }
    }
    fetchHistory()
  }, [userId])

  if (history.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">📋 My Job History</h2>
        <p className="text-[#64748B]500 text-sm">No job activity yet. Your job posts, completions, and deletions will appear here.</p>
      </div>
    )
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'POSTED': return '📝 Posted'
      case 'COMPLETED': return '✅ Completed'
      case 'DELETED': return '❌ Removed'
      case 'AWARDED': return '🎯 Awarded'
      default: return action
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'POSTED': return 'bg-[#3B82F6]/10 text-[#3B82F6]'
      case 'COMPLETED': return 'bg-[#10B981]/10 text-[#10B981]'
      case 'DELETED': return 'bg-[#EF4444]/10 text-[#EF4444]'
      case 'AWARDED': return 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
      default: return 'bg-gray-100 text-[#64748B]700'
    }
  }

  console.log('Rendering job history:', history)
  
  return (
    <div className="border border-gray-200 rounded-xl p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">📋 My Job History ({history.length} items)</h2>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded ${getActionColor(item.action)}`}>
                {getActionLabel(item.action)}
              </span>
              <span className="font-medium">
                {/* Show job_title directly since we no longer join */}
                {item.job_title || 'Job #' + item.job_id?.slice(0,8)}
              </span>
            </div>
            <span className="text-sm text-[#64748B]500">
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        ))}
        {history.length === 0 && (
          <p className="text-[#64748B]500 text-sm">No activity yet. Your job posts, completions, and deletions will appear here.</p>
        )}
      </div>
    </div>
  )
}

export default function Profile() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingReviews, setEditingReviews] = useState(false)
  const [editReviewLinks, setEditReviewLinks] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    trade_type: 'PAINTER',
    bio: '',
    years_experience: 0,
    availability: false,
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
    
    // Check if admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin, email')
      .eq('id', user.id)
      .single()
    
    if (userData?.is_admin || user.email?.toLowerCase().includes('heritagehousepainting')) {
      setIsAdmin(true)
    } else {
    }
    
    fetchProfile(user.id)
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      setProfile(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        company_name: data.company_name || '',
        phone: data.phone || '',
        trade_type: data.trade_type || 'PAINTER',
        bio: data.bio || '',
        years_experience: data.years_experience || 0,
        availability: data.availability || false,
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    
    const { error } = await supabase
      .from('users')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name,
        phone: formData.phone,
        trade_type: formData.trade_type,
        bio: formData.bio,
        years_experience: formData.years_experience,
        availability: formData.availability,
      })
      .eq('id', user.id)

    if (!error) {
      fetchProfile(user.id)
      setEditing(false)
    }
    
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#0F172A]">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const isContractor = profile?.user_type === 'CONTRACTOR'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-gray-900">
            Trade<span className="text-blue-600">Source</span>
          </Link>
          <nav className="flex gap-6 items-center text-sm">
            <Link href="/feed" className="text-gray-600 hover:text-gray-900 transition-colors">Feed</Link>
            <Link href="/contractors" className="text-gray-600 hover:text-gray-900 transition-colors">Contractors</Link>
            <Link href="/community" className="text-gray-600 hover:text-gray-900 transition-colors">Community</Link>
            <Link href="/jobs/post" className="text-gray-600 hover:text-gray-900 transition-colors">Post</Link>
            <Link href="/messages" className="text-gray-600 hover:text-gray-900 transition-colors">Messages</Link>
            <Link href="/profile" className="font-semibold text-gray-900">Profile</Link>
            {isAdmin && (
              <Link href="/admin" className="text-green-600 font-semibold">🔧 Admin</Link>
            )}
            <button onClick={handleSignOut} className="text-gray-600 hover:text-gray-900 transition-colors">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">Manage your account and verification</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Contractor Stats & Badges */}
        {isContractor && profile && (
          <div className="mb-8">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-3xl font-bold text-gray-900">{profile.jobs_completed || 0}</div>
                <div className="text-sm text-gray-500">Jobs Done</div>
              </div>
              <div className="text-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-3xl font-bold text-gray-900">{profile.avg_rating || 0}</div>
                <div className="text-sm text-gray-500">⭐ Rating</div>
              </div>
              <div className="text-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-3xl font-bold text-gray-900">{profile.review_count || 0}</div>
                <div className="text-sm text-gray-500">Reviews</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-xl">
                <div className="text-2xl font-bold text-[#0F172A]">{profile.years_experience || 0}</div>
                <div className="text-sm">Years Exp.</div>
              </div>
            </div>

            {/* Verification Badges */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <Badge type="verified" label="Verified" verified={profile.verification_status === 'APPROVED'} />
              <Badge type="insured" label="Insured" verified={profile.verification_status === 'APPROVED'} />
              <Badge type="tax" label="W-9" verified={profile.verification_status === 'APPROVED'} />
              <Badge type="reviews" label="Reviews" verified={!!profile.external_reviews} />
            </div>

            {/* FIXED Verification Section */}
            <VerificationSection 
              profile={profile} 
              externalReviews={profile.external_reviews || ''}
              onUpdate={() => fetchProfile(profile.id)} 
            />
          </div>
        )}

        {/* Profile Details */}
        <div className="border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-[#0F172A]">Profile Details</h2>
          
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              {isContractor && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Trade Type</label>
                    <select
                      value={formData.trade_type}
                      onChange={e => setFormData({ ...formData, trade_type: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2"
                    >
                      <option value="PAINTER">Painter</option>
                      <option value="GENERAL_CONTRACTOR">General Contractor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={formData.years_experience}
                      onChange={e => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  placeholder="Tell homeowners about your business..."
                />
              </div>

              {isContractor && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.availability}
                    onChange={e => setFormData({ ...formData, availability: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Available for new jobs</span>
                </label>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#0F172A] text-white px-4 py-2 rounded-xl disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="border px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm opacity-70">Name</div>
                  <div className="font-medium">{profile?.first_name} {profile?.last_name}</div>
                </div>
                <div>
                  <div className="text-sm opacity-70">Company</div>
                  <div className="font-medium">{profile?.company_name || 'Not set'}</div>
                </div>
              </div>

              <div>
                <div className="text-sm opacity-70">Email</div>
                <div className="font-medium">{profile?.email}</div>
              </div>

              <div>
                <div className="text-sm opacity-70">Phone</div>
                <div className="font-medium">{profile?.phone || 'Not set'}</div>
              </div>

              {isContractor && (
                <>
                  <div>
                    <div className="text-sm opacity-70">Trade</div>
                    <div className="font-medium">{profile?.trade_type}</div>
                  </div>

                  <div>
                    <div className="text-sm opacity-70">Experience</div>
                    <div className="font-medium">{profile?.years_experience || 0} years</div>
                  </div>
                </>
              )}

              <div>
                <div className="text-sm opacity-70">Bio</div>
                <div className="font-medium">{profile?.bio || 'No bio yet'}</div>
              </div>

              {isContractor && (
                <div>
                  <div className="text-sm opacity-70">Availability</div>
                  <div className="font-medium">{profile?.availability ? '✓ Available' : '✗ Not available'}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portfolio Section for Contractors */}
        {isContractor && (
          <div className="border border-gray-200 rounded-xl p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Portfolio</h2>
            <p className="text-sm mb-4 opacity-70">Showcase your best work to homeowners.</p>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {profile?.portfolio_urls && profile.portfolio_urls.length > 0 ? (
                profile.portfolio_urls.map((url, i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 border-2 border-dashed rounded-xl">
                  <p className="opacity-70">No portfolio images yet</p>
                </div>
              )}
            </div>
            
            <button className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm">
              Add Portfolio Images
            </button>
          </div>
        )}

        {/* External Reviews Section - EDITABLE */}
        {isContractor && (
          <div className="border border-gray-200 rounded-xl p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">External Reviews</h2>
              <button
                onClick={() => {
                  if (!editingReviews) {
                    // Initialize with existing reviews
                    const existing = profile?.external_reviews?.split('\n').filter(l => l.trim()) || []
                    setEditReviewLinks(existing.length > 0 ? existing : [''])
                  }
                  setEditingReviews(!editingReviews)
                }}
                className="text-blue-600 text-sm underline"
              >
                {editingReviews ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {editingReviews ? (
              <div className="space-y-3">
                {/* Required review link */}
                <div>
                  <label className="block text-sm font-medium mb-1">Required Review Link *</label>
                  <input
                    type="url"
                    placeholder="https://www.google.com/reviews/..."
                    value={editReviewLinks[0] || ''}
                    onChange={(e) => {
                      const newLinks = [...editReviewLinks]
                      newLinks[0] = e.target.value
                      setEditReviewLinks(newLinks)
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>
                
                {/* Additional review links */}
                {editReviewLinks.slice(1).map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Additional review link"
                      value={link || ''}
                      onChange={(e) => {
                        const newLinks = [...editReviewLinks]
                        newLinks[i + 1] = e.target.value
                        setEditReviewLinks(newLinks)
                      }}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2"
                    />
                    <button
                      onClick={() => {
                        const newLinks = editReviewLinks.filter((_, idx) => idx !== i + 1)
                        setEditReviewLinks(newLinks)
                      }}
                      className="text-red-500 px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => setEditReviewLinks([...editReviewLinks, ''])}
                  className="text-blue-600 text-sm underline"
                >
                  + Add Another Review
                </button>
                
                <button
                  onClick={async () => {
                    // Save to database
                    const links = editReviewLinks.filter(l => l.trim()).join('\n')
                    await supabase.from('users').update({ external_reviews: links }).eq('id', user.id)
                    // Refresh profile
                    fetchProfile(user.id)
                    setEditingReviews(false)
                  }}
                  className="w-full bg-[#0F172A] text-white py-2 rounded-xl mt-2"
                >
                  Save Reviews
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm mb-4 opacity-70">
                  {profile?.external_reviews ? 'Your review links (click to open):' : 'No external reviews added yet.'}
                </p>
                {profile?.external_reviews ? (
                  <div className="space-y-2">
                    {profile.external_reviews.split('\n').filter(link => link.trim()).map((link, i) => (
                      <a 
                        key={i} 
                        href={link.trim()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50"
                      >
                        <span className="text-lg">
                          {link.includes('google') ? '🔍' : link.includes('yelp') ? '⭐' : '📘'}
                        </span>
                        <span className="font-medium">{link.includes('google') ? 'Google' : link.includes('yelp') ? 'Yelp' : 'Review'}</span>
                        <span className="text-sm opacity-70">→</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="opacity-70">Click "Edit" to add your review links.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Job History Section for All Users */}
        {user && (
          <JobHistorySection userId={user.id} />
        )}
      </main>
    </div>
  )
}