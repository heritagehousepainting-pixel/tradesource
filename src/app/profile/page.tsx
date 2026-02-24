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
  subscription_tier: string
  subscription_status: string
  availability: boolean
  bio: string
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
        availability: formData.availability,
      })
      .eq('id', user.id)

    if (!error) {
      setProfile({ ...profile!, ...formData })
      setEditing(false)
    }
    
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold">TradeSource</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed">Feed</Link>
            <Link href="/jobs/post">Post</Link>
            <Link href="/messages">Messages</Link>
            <Link href="/profile" className="font-medium">Profile</Link>
            <button onClick={handleSignOut} className="text-slate-600 hover:text-slate-900">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-slate-600 hover:text-slate-900"
            >
              Edit
            </button>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <h2 className="font-medium mb-2">Account</h2>
          <p className="text-slate-600">{profile?.email}</p>
          <p className="text-sm text-slate-500 capitalize">{profile?.user_type?.toLowerCase()}</p>
        </div>

        {/* Profile Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              {editing ? (
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                />
              ) : (
                <p className="text-slate-600">{profile?.first_name || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              {editing ? (
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
              ) : (
                <p className="text-slate-600">{profile?.last_name || '-'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            {editing ? (
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.company_name}
                onChange={e => setFormData({...formData, company_name: e.target.value})}
              />
            ) : (
              <p className="text-slate-600">{profile?.company_name || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            {editing ? (
              <input
                type="tel"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            ) : (
              <p className="text-slate-600">{profile?.phone || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Trade Type</label>
            {editing ? (
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.trade_type}
                onChange={e => setFormData({...formData, trade_type: e.target.value})}
              >
                <option value="PAINTER">Painter</option>
                <option value="GENERAL_CONTRACTOR">General Contractor</option>
              </select>
            ) : (
              <p className="text-slate-600">{profile?.trade_type?.replace('_', ' ') || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            {editing ? (
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
              />
            ) : (
              <p className="text-slate-600">{profile?.bio || '-'}</p>
            )}
          </div>

          {editing && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Verification Status */}
        <div className="mt-8 pt-6 border-t">
          <h2 className="font-medium mb-4">Verification Status</h2>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-sm ${
              profile?.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {profile?.is_verified ? '✓ Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>

        {/* Subscription */}
        <div className="mt-6 pt-6 border-t">
          <h2 className="font-medium mb-4">Subscription</h2>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{profile?.subscription_tier || 'BASIC'}</p>
                <p className="text-sm text-slate-500">{profile?.subscription_status || 'ACTIVE'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
