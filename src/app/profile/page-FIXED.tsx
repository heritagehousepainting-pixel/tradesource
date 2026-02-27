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
    verified: 'bg-blue-100 text-blue-700 border-blue-300',
    insured: 'bg-green-100 text-green-700 border-green-300',
    tax: 'bg-orange-100 text-orange-700 border-orange-300',
    reviews: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  }
  const icons = {
    verified: '✓',
    insured: '🛡️',
    tax: '📋',
    reviews: '⭐',
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colors[type]} ${verified ? '' : 'opacity-50'}`}>
      <span className="text-lg">{icons[type]}</span>
      <span className="font-medium">{label}</span>
      {verified && <span className="text-xs">✓</span>}
    </div>
  )
}

// FIXED Verification Section - Single submission for all 4 docs
function VerificationSection({ profile, onUpdate }: { profile: UserProfile; onUpdate: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Text inputs
    paLicenseNumber: '',
    insuranceProvider: '',
    insuranceExpiry: '',
    reviewLinks: '',
    
    // File uploads
    driverLicense: null as File | null,
    paLicenseCert: null as File | null,
    insuranceCert: null as File | null,
    w9Form: null as File | null,
  })
  const supabase = createClient()

  // Check completion status
  const allFieldsComplete = 
    formData.paLicenseNumber.trim() !== '' &&
    formData.insuranceProvider.trim() !== '' &&
    formData.insuranceExpiry.trim() !== '' &&
    formData.reviewLinks.trim() !== '' &&
    formData.driverLicense !== null &&
    formData.paLicenseCert !== null &&
    formData.insuranceCert !== null &&
    formData.w9Form !== null

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
      // Upload all files
      const timestamp = Date.now()
      const userId = profile.id
      
      const [driverLicensePath, paLicensePath, insurancePath, w9Path] = await Promise.all([
        uploadFile(formData.driverLicense!, `${userId}/driver-license-${timestamp}.pdf`),
        uploadFile(formData.paLicenseCert!, `${userId}/pa-license-${timestamp}.pdf`),
        uploadFile(formData.insuranceCert!, `${userId}/insurance-${timestamp}.pdf`),
        uploadFile(formData.w9Form!, `${userId}/w9-${timestamp}.pdf`),
      ])

      // Submit all verification data at once
      const { error } = await supabase
        .from('users')
        .update({
          verification_status: 'PENDING',
          license_number: formData.paLicenseNumber,
          insurance_provider: formData.insuranceProvider,
          insurance_expiry: formData.insuranceExpiry,
          external_reviews: formData.reviewLinks,
          // Store file paths in verification_documents JSON field
          verification_documents: JSON.stringify({
            driver_license: driverLicensePath,
            pa_license: paLicensePath,
            insurance_cert: insurancePath,
            w9_form: w9Path,
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
      alert(`Error submitting documents: ${error.message}`)
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
      <div className="border rounded-xl p-6 bg-green-50 border-green-200">
        <h2 className="text-xl font-bold mb-4 text-green-800">✅ Verification Complete</h2>
        <p className="text-green-700">Congratulations! You're fully verified and have full access to:</p>
        <ul className="mt-2 text-green-700 text-sm">
          <li>• View all job prices</li>
          <li>• Post jobs to the network</li>
          <li>• Express interest on jobs</li>
          <li>• Full messaging capabilities</li>
        </ul>
      </div>
    )
  }

  return (
    <div className="border rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">📋 Verification Requirements</h2>
      <p className="text-sm mb-6 text-gray-600">
        Complete all 4 requirements and submit together for admin review. No partial submissions allowed.
      </p>

      {/* Status Messages */}
      {showPending && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <p className="text-yellow-800 font-medium">⏳ Under Review</p>
          <p className="text-sm text-yellow-700">Your verification is being processed. You'll receive email notification once approved.</p>
        </div>
      )}

      {showRejected && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <p className="text-red-800 font-medium">❌ Verification Rejected</p>
          <p className="text-sm text-red-700 mb-2">
            <strong>Admin Feedback:</strong> {profile.verification_notes || 'Please review and correct the issues below.'}
          </p>
          <p className="text-sm text-red-700">Fix the issues and resubmit all documents.</p>
        </div>
      )}

      {/* Verification Form - Only show if not pending */}
      {!showPending && (
        <div className="space-y-6">
          {/* Requirement 1: Driver's License */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              🪪 1. Driver's License
              {formData.driverLicense && <span className="text-green-600 text-sm">✓ Uploaded</span>}
            </h3>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange('driverLicense')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Upload clear photo of your driver's license (PDF, JPG, PNG)</p>
          </div>

          {/* Requirement 2: PA License + Certificate */}
          <div className="border rounded-lg p-4">
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
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange('paLicenseCert')}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500">Upload your PA HIC license certificate</p>
            </div>
          </div>

          {/* Requirement 3: Insurance */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              🛡️ 3. Liability Insurance ($1M+ Required)
              {formData.insuranceProvider && formData.insuranceExpiry && formData.insuranceCert && <span className="text-green-600 text-sm">✓ Complete</span>}
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Insurance Company Name"
                value={formData.insuranceProvider}
                onChange={e => setFormData({ ...formData, insuranceProvider: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="date"
                placeholder="Policy Expiry Date"
                value={formData.insuranceExpiry}
                onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange('insuranceCert')}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500">Upload Certificate of Insurance showing $1M+ liability coverage</p>
            </div>
          </div>

          {/* Requirement 4: W-9 Tax Form */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              📋 4. W-9 Tax Form
              {formData.w9Form && <span className="text-green-600 text-sm">✓ Uploaded</span>}
            </h3>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange('w9Form')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload completed W-9 form. <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" target="_blank" className="text-blue-600 underline">Download blank W-9 here</a>
            </p>
          </div>

          {/* BONUS: External Reviews */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              ⭐ Bonus: External Reviews (Optional but Recommended)
              {formData.reviewLinks && <span className="text-green-600 text-sm">✓ Added</span>}
            </h3>
            <textarea
              placeholder="Add links to your Google, Yelp, or Facebook reviews (one per line)"
              value={formData.reviewLinks}
              onChange={e => setFormData({ ...formData, reviewLinks: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Help homeowners trust you by showing your existing reviews</p>
          </div>

          {/* Progress Indicator */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Completion Progress</span>
              <span className="text-sm">
                {[
                  formData.driverLicense !== null,
                  formData.paLicenseNumber.trim() !== '' && formData.paLicenseCert !== null,
                  formData.insuranceProvider.trim() !== '' && formData.insuranceExpiry.trim() !== '' && formData.insuranceCert !== null,
                  formData.w9Form !== null
                ].filter(Boolean).length} / 4 Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ 
                  width: `${([
                    formData.driverLicense !== null,
                    formData.paLicenseNumber.trim() !== '' && formData.paLicenseCert !== null,
                    formData.insuranceProvider.trim() !== '' && formData.insuranceExpiry.trim() !== '' && formData.insuranceCert !== null,
                    formData.w9Form !== null
                  ].filter(Boolean).length) * 25}%` 
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitAll}
            disabled={submitting || !allFieldsComplete}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              allFieldsComplete && !submitting
                ? 'bg-slate-900 text-white hover:bg-slate-800' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
              `Complete All 4 Requirements First (${[
                formData.driverLicense !== null,
                formData.paLicenseNumber.trim() !== '' && formData.paLicenseCert !== null,
                formData.insuranceProvider.trim() !== '' && formData.insuranceExpiry.trim() !== '' && formData.insuranceCert !== null,
                formData.w9Form !== null
              ].filter(Boolean).length}/4)`
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            All documents will be reviewed by our admin team within 24-48 hours.
          </p>
        </div>
      )}
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
      <div className="min-h-screen flex items-center justify-center text-black">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const isContractor = profile?.user_type === 'CONTRACTOR'

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-black">TradeSource</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed" className="text-black">Feed</Link>
            <Link href="/jobs/post" className="text-black">Post</Link>
            <Link href="/messages" className="text-black">Messages</Link>
            <Link href="/profile" className="text-black font-medium">Profile</Link>
            <button onClick={handleSignOut} className="text-black">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">My Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-black hover:text-black px-4 py-2 border rounded-lg"
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
              <div className="text-center p-4 border rounded-xl">
                <div className="text-2xl font-bold text-black">{profile.jobs_completed || 0}</div>
                <div className="text-sm">Jobs Done</div>
              </div>
              <div className="text-center p-4 border rounded-xl">
                <div className="text-2xl font-bold text-black">{profile.avg_rating || 0}</div>
                <div className="text-sm">⭐ Rating</div>
              </div>
              <div className="text-center p-4 border rounded-xl">
                <div className="text-2xl font-bold text-black">{profile.review_count || 0}</div>
                <div className="text-sm">Reviews</div>
              </div>
              <div className="text-center p-4 border rounded-xl">
                <div className="text-2xl font-bold text-black">{profile.years_experience || 0}</div>
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
              onUpdate={() => fetchProfile(profile.id)} 
            />
          </div>
        )}

        {/* Profile Details */}
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-black">Profile Details</h2>
          
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {isContractor && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Trade Type</label>
                    <select
                      value={formData.trade_type}
                      onChange={e => setFormData({ ...formData, trade_type: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
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
                      className="w-full border rounded-lg px-3 py-2"
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
                  className="w-full border rounded-lg px-3 py-2"
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
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="border px-4 py-2 rounded-lg"
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
          <div className="border rounded-xl p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Portfolio</h2>
            <p className="text-sm mb-4 opacity-70">Showcase your best work to homeowners.</p>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {profile?.portfolio_urls && profile.portfolio_urls.length > 0 ? (
                profile.portfolio_urls.map((url, i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="opacity-70">No portfolio images yet</p>
                </div>
              )}
            </div>
            
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">
              Add Portfolio Images
            </button>
          </div>
        )}

        {/* External Reviews Section for Contractors */}
        {isContractor && (
          <div className="border rounded-xl p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">External Reviews</h2>
            <p className="text-sm mb-4 opacity-70">Links to your reviews on other platforms.</p>
            
            {profile?.external_reviews ? (
              <div className="space-y-2">
                {profile.external_reviews.split('\n').filter(link => link.trim()).map((link, i) => (
                  <a 
                    key={i} 
                    href={link.trim()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50"
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
              <p className="opacity-70">No external reviews added yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}