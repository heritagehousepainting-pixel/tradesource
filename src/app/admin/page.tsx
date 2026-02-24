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
    
    if (userData?.is_admin || user.email?.includes('heritagehousepainting')) {
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
      setContractors(data)
    }
    setLoading(false)
  }

  const handleVerify = async (userId: string) => {
    setActionLoading(userId)
    await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', userId)
    
    fetchContractors()
    setActionLoading(null)
  }

  const handleReject = async (userId: string) => {
    setActionLoading(userId)
    await supabase
      .from('users')
      .update({ is_verified: false })
      .eq('id', userId)
    
    fetchContractors()
    setActionLoading(null)
  }

  const handleResetToPending = async (userId: string) => {
    setActionLoading(userId)
    await supabase
      .from('users')
      .update({ is_verified: null })
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
          <button onClick={handleSignOut} className="text-slate-600 underline">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Filter by status
  const pending = contractors.filter(c => c.is_verified === null || c.is_verified === undefined)
  const verified = contractors.filter(c => c.is_verified === true)
  const rejected = contractors.filter(c => c.is_verified === false)

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
          <Link href="/feed" className="text-xl font-bold">TradeSource Admin</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed">Feed</Link>
            <Link href="/admin" className="font-medium">Verification</Link>
            <button onClick={handleSignOut} className="text-slate-600 hover:text-slate-900">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Contractor Verification</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'pending' 
                ? 'border-b-2 border-slate-900 text-slate-900' 
                : 'text-slate-500'
            }`}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'verified' 
                ? 'border-b-2 border-slate-900 text-slate-900' 
                : 'text-slate-500'
            }`}
          >
            Verified ({verified.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'rejected' 
                ? 'border-b-2 border-slate-900 text-slate-900' 
                : 'text-slate-500'
            }`}
          >
            Rejected ({rejected.length})
          </button>
        </div>

        {/* List */}
        {currentContractors.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <p className="text-slate-500">
              {activeTab === 'pending' && 'No contractors pending verification.'}
              {activeTab === 'verified' && 'No verified contractors.'}
              {activeTab === 'rejected' && 'No rejected contractors.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentContractors.map(contractor => (
              <div key={contractor.id} className="border rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {contractor.first_name} {contractor.last_name}
                  </p>
                  <p className="text-sm text-slate-500">{contractor.company_name || 'No company'}</p>
                  <p className="text-sm text-slate-500">{contractor.email}</p>
                  <p className="text-sm text-slate-500">{contractor.trade_type?.replace('_', ' ')}</p>
                </div>
                <div className="flex gap-2">
                  {activeTab === 'pending' && (
                    <>
                      <button
                        onClick={() => handleVerify(contractor.id)}
                        disabled={actionLoading === contractor.id}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(contractor.id)}
                        disabled={actionLoading === contractor.id}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {activeTab === 'verified' && (
                    <button
                      onClick={() => handleReject(contractor.id)}
                      disabled={actionLoading === contractor.id}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                  {activeTab === 'rejected' && (
                    <>
                      <button
                        onClick={() => handleVerify(contractor.id)}
                        disabled={actionLoading === contractor.id}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleResetToPending(contractor.id)}
                        disabled={actionLoading === contractor.id}
                        className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-sm hover:bg-yellow-200 disabled:opacity-50"
                      >
                        Reset to Pending
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
