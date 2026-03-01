'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Contractor {
  id: string
  email: string
  user_type: string
  first_name: string
  last_name: string
  company_name: string
  trade_type: string
  phone: string
  is_verified: boolean
  is_admin: boolean
  bio: string
  verification_status: string
  verification_notes: string
  license_number: string
  insurance_provider: string
  insurance_expiry: string
  external_reviews: string
  verification_documents: any
  workmen_comp_provider: string
  workmen_comp_expiry: string
  created_at: string
}

export default function AdminVerification() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending')

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
    
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin, email')
      .eq('id', user.id)
      .single()
    
    if (userData?.is_admin || user.email?.toLowerCase().includes('heritagehousepainting')) {
      setIsAdmin(true)
      fetchContractors()
    } else {
      setLoading(false)
    }
  }

  const fetchContractors = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'CONTRACTOR')
      .order('created_at', { ascending: false })
    
    if (data) {
      // Parse verification_documents JSON if it's a string
      const parsedData = data.map((contractor: any) => ({
        ...contractor,
        verification_documents: typeof contractor.verification_documents === 'string' 
          ? JSON.parse(contractor.verification_documents || '{}') 
          : contractor.verification_documents
      }))
      setContractors(parsedData)
    }
    setLoading(false)
  }

  const handleApprove = async (userId: string) => {
    setActionLoading(userId)
    await supabase
      .from('users')
      .update({ 
        verification_status: 'APPROVED',
        is_verified: true,
        is_insured: true,
      })
      .eq('id', userId)
    
    fetchContractors()
    setActionLoading(null)
  }

  const handleReject = async (userId: string, notes: string = '') => {
    setActionLoading(userId)
    await supabase
      .from('users')
      .update({ 
        verification_status: 'REJECTED',
        verification_notes: notes,
      })
      .eq('id', userId)
    
    fetchContractors()
    setActionLoading(null)
  }

  const handleResetToPending = async (userId: string) => {
    setActionLoading(userId)
    await supabase
      .from('users')
      .update({ 
        verification_status: 'PENDING',
        verification_notes: null,
      })
      .eq('id', userId)
    
    fetchContractors()
    setActionLoading(null)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <button onClick={handleSignOut} className="text-black underline">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Filter by status
  const pending = contractors.filter(c => !c.verification_status || c.verification_status === 'PENDING')
  const verified = contractors.filter(c => c.verification_status === 'APPROVED')
  const rejected = contractors.filter(c => c.verification_status === 'REJECTED')

  const getContractors = () => {
    switch (activeTab) {
      case 'pending': return pending
      case 'verified': return verified
      case 'rejected': return rejected
    }
  }

  const currentContractors = getContractors()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-black">TradeSource Admin</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed" className="text-black">Feed</Link>
            <Link href="/contractors" className="text-black">Contractors</Link>
            <Link href="/community" className="text-black">Community</Link>
            <Link href="/jobs/post" className="text-black">Post</Link>
            <Link href="/messages" className="text-black">Messages</Link>
            <Link href="/profile" className="text-black">Profile</Link>
            <Link href="/admin" className="text-black font-medium">Admin</Link>
            <button onClick={handleSignOut} className="text-black hover:text-black">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{contractors.length}</p>
            <p className="text-sm text-blue-600">Total Contractors</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{pending.length}</p>
            <p className="text-sm text-yellow-600">Pending Verification</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{verified.length}</p>
            <p className="text-sm text-green-600">Verified</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{rejected.length}</p>
            <p className="text-sm text-purple-600">Rejected</p>
          </div>
        </div>

        {/* Contractor Verification Section */}
        <h2 className="text-xl font-bold mb-4">Contractor Verification</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'pending' 
                ? 'border-b-2 border-slate-900 text-black' 
                : 'text-black'
            }`}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'verified' 
                ? 'border-b-2 border-slate-900 text-black' 
                : 'text-black'
            }`}
          >
            Verified ({verified.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'rejected' 
                ? 'border-b-2 border-slate-900 text-black' 
                : 'text-black'
            }`}
          >
            Rejected ({rejected.length})
          </button>
        </div>

        {/* List */}
        {currentContractors.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <p className="text-black">
              {activeTab === 'pending' && 'No contractors pending verification.'}
              {activeTab === 'verified' && 'No verified contractors.'}
              {activeTab === 'rejected' && 'No rejected contractors.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentContractors.map(contractor => (
              <div key={contractor.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">
                      {contractor.first_name} {contractor.last_name}
                    </p>
                    <p className="text-sm text-black">{contractor.company_name || 'No company'}</p>
                    <p className="text-sm text-black">{contractor.email}</p>
                    <p className="text-sm text-black">{contractor.trade_type?.replace('_', ' ')}</p>
                    <p className="text-xs text-black">Signed up: {new Date(contractor.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(contractor.id)}
                          disabled={actionLoading === contractor.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          ✅ Approve All
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Reason for rejection:')
                            if (notes) handleReject(contractor.id, notes)
                          }}
                          disabled={actionLoading === contractor.id}
                          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {activeTab === 'verified' && (
                      <button
                        onClick={() => {
                          const notes = prompt('Reason for revocation:')
                          if (notes) handleReject(contractor.id, notes)
                        }}
                        disabled={actionLoading === contractor.id}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                    {activeTab === 'rejected' && (
                      <button
                        onClick={() => handleResetToPending(contractor.id)}
                        disabled={actionLoading === contractor.id}
                        className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-sm hover:bg-yellow-200 disabled:opacity-50"
                      >
                        Reset to Pending
                      </button>
                    )}
                  </div>
                </div>

                {/* Submitted Documents */}
                <div className="bg-slate-50 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-2">📋 Submitted Documents:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>🪪 Driver's License:</span>
                      <a 
                        href={`https://ueaojdmbqbgkvkmhuhnm.supabase.co/storage/v1/object/public/verification-docs/${contractor.verification_documents?.driver_license}`}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        {contractor.verification_documents?.driver_license ? '📄 View File' : '❌ Missing'}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span>🏢 PA HIC License:</span>
                      <span className="font-mono">{contractor.license_number || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🛡️ General Liability:</span>
                      <span className="font-mono">{contractor.insurance_provider || '—'} (exp: {contractor.insurance_expiry || '—'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🛡️ GL Certificate:</span>
                      <a 
                        href={`https://ueaojdmbqbgkvkmhuhnm.supabase.co/storage/v1/object/public/verification-docs/${contractor.verification_documents?.insurance_cert}`}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        {contractor.verification_documents?.insurance_cert ? '📄 View File' : '❌ Missing'}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span>👷 Workmen's Comp:</span>
                      <span className="font-mono">{contractor.workmen_comp_provider || '—'} (exp: {contractor.workmen_comp_expiry || '—'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>👷 WC Certificate:</span>
                      <a 
                        href={`https://ueaojdmbqbgkvkmhuhnm.supabase.co/storage/v1/object/public/verification-docs/${contractor.verification_documents?.workmen_comp_cert}`}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        {contractor.verification_documents?.workmen_comp_cert ? '📄 View File' : '❌ Missing'}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span>📋 W-9 Tax Form:</span>
                      <a 
                        href={`https://ueaojdmbqbgkvkmhuhnm.supabase.co/storage/v1/object/public/verification-docs/${contractor.verification_documents?.w9_form}`}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        {contractor.verification_documents?.w9_form ? '📄 View File' : '❌ Missing'}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span>⭐ External Reviews:</span>
                      <span className="font-mono truncate max-w-[200px]">{contractor.external_reviews || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Rejection feedback */}
                {contractor.verification_status === 'REJECTED' && contractor.verification_notes && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-sm">
                    <strong>Rejection Feedback:</strong> {contractor.verification_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}