'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface VerificationDoc {
  id: string
  user_id: string
  doc_type: string
  file_url: string
  status: string
  created_at: string
}

interface Contractor {
  id: string
  email: string
  user_type: string
  first_name: string
  last_name: string
  company_name: string
  trade_type: string
  is_verified: boolean
  is_admin: boolean
  created_at: string
  verification_docs: VerificationDoc[]
}

export default function AdminVerification() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)

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
    
    if (user.email === 'jack@tradesource.com' || user.email === 'heritagehousepainting@gmail.com') {
      setIsAdmin(true)
      fetchContractors()
    } else {
      setLoading(false)
    }
  }

  const fetchContractors = async () => {
    const { data: contractorsData } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'CONTRACTOR')
      .order('created_at', { ascending: false })
    
    if (contractorsData) {
      // Fetch verification docs for each contractor
      const contractorsWithDocs = await Promise.all(
        contractorsData.map(async (contractor) => {
          const { data: docs } = await supabase
            .from('verification_docs')
            .select('*')
            .eq('user_id', contractor.id)
            .order('created_at', { ascending: false })
          
          return {
            ...contractor,
            verification_docs: docs || []
          }
        })
      )
      setContractors(contractorsWithDocs)
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

  const handleReject = async (userId: string) => {
    await supabase
      .from('users')
      .update({ is_verified: false })
      .eq('id', userId)
    
    fetchContractors()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const updateDocStatus = async (docId: string, status: string) => {
    await supabase
      .from('verification_docs')
      .update({ status })
      .eq('id', docId)
    
    fetchContractors()
    if (selectedContractor) {
      const updated = contractors.find(c => c.id === selectedContractor.id)
      if (updated) setSelectedContractor(updated)
    }
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
            <Link href="/admin">Verification</Link>
            <button onClick={handleSignOut} className="text-slate-600 hover:text-slate-900">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Contractor Verification</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold">{contractors.length}</p>
            <p className="text-slate-500">Total Contractors</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-yellow-700">{pendingVerification.length}</p>
            <p className="text-yellow-600">Pending Verification</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-700">{verified.length}</p>
            <p className="text-green-600">Verified</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Pending Verification ({pendingVerification.length})</h2>
        </div>

        {pendingVerification.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <p className="text-slate-500">No contractors pending verification.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingVerification.map(contractor => (
              <div key={contractor.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {contractor.first_name} {contractor.last_name}
                      </h3>
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{contractor.company_name || 'No company'}</p>
                    <p className="text-sm text-slate-500">{contractor.email}</p>
                    <p className="text-sm text-slate-500">{contractor.trade_type?.replace('_', ' ')}</p>
                    
                    {/* Verification Docs */}
                    {contractor.verification_docs && contractor.verification_docs.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Submitted Documents:</p>
                        <div className="space-y-2">
                          {contractor.verification_docs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between bg-slate-50 rounded p-2">
                              <div>
                                <p className="text-sm font-medium">{doc.doc_type}</p>
                                <a 
                                  href={doc.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View File
                                </a>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateDocStatus(doc.id, 'APPROVED')}
                                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateDocStatus(doc.id, 'REJECTED')}
                                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleVerify(contractor.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(contractor.id)}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verified Section */}
        <div className="mt-8 pt-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Verified Contractors ({verified.length})</h2>
          {verified.length === 0 ? (
            <p className="text-slate-500">No verified contractors yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {verified.map(contractor => (
                <div key={contractor.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">✓</span>
                    <span className="font-medium text-sm">
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
