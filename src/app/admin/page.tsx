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
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (userData?.is_admin) {
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
    const { error } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', userId)
    
    if (!error) {
      fetchContractors()
    }
    setActionLoading(null)
  }

  const handleReject = async (userId: string) => {
    setActionLoading(userId)
    const { error } = await supabase
      .from('users')
      .update({ is_verified: false })
      .eq('id', userId)
    
    if (!error) {
      fetchContractors()
    }
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
          <p className="text-slate-600 mb-4">You don't have admin access.</p>
          <button onClick={handleSignOut} className="text-slate-600 underline">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  const pendingVerification = contractors.filter(c => !c.is_verified)
  const verified = contractors.filter(c => c.is_verified)

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

        {/* Pending Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Pending Verification ({pendingVerification.length})
          </h2>

          {pendingVerification.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl">
              <p className="text-slate-500">No contractors pending verification.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVerification.map(contractor => (
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
                    <button
                      onClick={() => handleVerify(contractor.id)}
                      disabled={actionLoading === contractor.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === contractor.id ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(contractor.id)}
                      disabled={actionLoading === contractor.id}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verified Section */}
        <div className="pt-6 border-t">
          <h2 className="text-lg font-semibold mb-4">
            Verified Contractors ({verified.length})
          </h2>

          {verified.length === 0 ? (
            <p className="text-slate-500">No verified contractors yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {verified.map(contractor => (
                <div key={contractor.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="font-medium">
                      {contractor.first_name} {contractor.last_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{contractor.company_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
