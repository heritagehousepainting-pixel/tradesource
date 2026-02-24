'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface User {
  id: string
  email: string
  user_type: string
  first_name: string
  last_name: string
  company_name: string
  trade_type: string
  is_verified: boolean
  created_at: string
}

export default function Admin() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [contractors, setContractors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
    
    // Check if admin (hardcoded for now - Jack's email)
    if (user.email === 'jack@tradesource.com' || user.email === 'heritagehousepainting@gmail.com') {
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
    await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', userId)
    
    fetchContractors()
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

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold">TradeSource Admin</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed">Feed</Link>
            <Link href="/admin">Admin</Link>
            <button onClick={handleSignOut} className="text-slate-600 hover:text-slate-900">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Contractor Verifications</h1>

        {contractors.length === 0 ? (
          <p className="text-slate-500">No contractors to verify.</p>
        ) : (
          <div className="space-y-4">
            {contractors.map(contractor => (
              <div key={contractor.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {contractor.first_name} {contractor.last_name}
                      </h3>
                      {contractor.is_verified ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">✓ Verified</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Pending</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{contractor.company_name || 'No company'}</p>
                    <p className="text-sm text-slate-500">{contractor.email}</p>
                    <p className="text-sm text-slate-500">{contractor.trade_type?.replace('_', ' ')}</p>
                  </div>
                  {!contractor.is_verified && (
                    <button
                      onClick={() => handleVerify(contractor.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
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
