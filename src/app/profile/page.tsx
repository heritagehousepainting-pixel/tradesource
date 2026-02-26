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

// Verification Section for Contractors - Single submission for all 4 docs
function VerificationSection({ profile, onUpdate }: { profile: UserProfile; onUpdate: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    licenseNumber: '',
    insuranceProvider: '',
    insuranceExpiry: '',
    w9Submitted: false,
    reviewLinks: '',
  })
  const supabase = createClient()

  const handleSubmitAll = async () => {
    setSubmitting(true)
    
    // Submit all 4 docs at once for admin review
    const { error } = await supabase
      .from('users')
      .update({
        verification_status: 'PENDING',
        license_number: formData.licenseNumber,
        insurance_provider: formData.insuranceProvider,
        insurance_expiry: formData.insuranceExpiry,
        external_reviews: formData.reviewLinks,
      })
      .eq('id', profile.id)

    if (!error) {
      onUpdate()
    }
    
    setSubmitting(false)
  }

  // Check if fully verified (all 4 approved)
  const isFullyVerified = profile.verification_status === 'APPROVED'
  
  // Show current status
  const showPending = profile.verification_status === 'PENDING'
  const showRejected = profile.verification_status === 'REJECTED'

  // If fully verified, show success
  if (isFullyVerified) {
    return (
      <div className="border rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">✅ Verification Complete</h2>
        <p className="text-black">Congratulations! You're fully verified and have full access.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Verification Badges</h2>
      <p className="text-sm mb-6">Submit all 4 documents at once for review.</p>

      {/* Pending Status */}
      {showPending && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <p className="text-yellow-800 font-medium">⏳ Pending Review</p>
          <p className="text-sm text-yellow-700">Your documents are being reviewed. You'll be notified once approved.</p>
        </div>
      )}

      {/* Rejected Status */}
      {showRejected && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <p className="text-red-800 font-medium">❌ Verification Rejected</p>
          <p className="text-sm text-red-700">Feedback: {profile.verification_notes || 'Please fix the issues and resubmit.'}</p>
        </div>
      )}

      {/* Document Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Driver's License Number</label>
          <input
            type="text"
            value={formData.licenseNumber}
            onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter license number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">PA HIC License Number</label>
          <input
            type="text"
            value={formData.licenseNumber}
            onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter PA HIC license"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Insurance Provider</label>
          <input
            type="text"
            value={formData.insuranceProvider}
            onChange={e => setFormData({ ...formData, insuranceProvider: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Insurance company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Insurance Expiry Date</label>
          <input
            type="date"
            value={formData.insuranceExpiry}
            onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">External Review Links (Google, Yelp, Facebook)</label>
          <textarea
            value={formData.reviewLinks}
            onChange={e => setFormData({ ...formData, reviewLinks: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            rows={2}
            placeholder="Enter review links (one per line)"
          />
        </div>

        <button
          onClick={handleSubmitAll}
          disabled={submitting || showPending}
          className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : showPending ? 'Submitted - Pending Review' : 'Submit All for Review'}
        </button>
      </div>
    </div>
  )
}
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {item.verified ? 'Verified' : uploading === item.key ? 'Uploading...' : item.action}
            </button>
          </div>
        ))}
      </div>

      {profile.verification_status === 'PENDING' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">⏳ Verification pending review. You'll be notified once approved.</p>
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
    return <div className="min-h-screen flex items-center justify-center text-black">Loading...</div>
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
              className="text-black hover:text-black"
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

            {/* Verification Section */}
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
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg"
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
            <p className="text-sm mb-4 opacity-70">Add links to your reviews on other platforms.</p>
            
            {profile?.external_reviews ? (
              <div className="space-y-2">
                {JSON.parse(profile.external_reviews).map((review: any, i: number) => (
                  <a 
                    key={i} 
                    href={review.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-lg">
                      {review.platform === 'google' ? '🔍' : review.platform === 'yelp' ? '⭐' : '📘'}
                    </span>
                    <span className="font-medium">{review.platform}</span>
                    <span className="text-sm opacity-70">→</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="opacity-70">No external reviews added yet.</p>
            )}
            
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm mt-4">
              Add Review Link
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
