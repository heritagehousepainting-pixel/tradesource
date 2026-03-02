'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function ContractorSignup() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    tradeType: 'PAINTER',
    phone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: formData.email,
          user_type: 'CONTRACTOR',
          first_name: formData.firstName,
          last_name: formData.lastName,
          company_name: formData.companyName,
          phone: formData.phone,
          trade_type: formData.tradeType,
        })

        if (profileError) throw profileError

        router.push('/feed')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b py-4">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-xl font-bold text-[#0F172A]">TradeSource</Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl p-8 shadow-md">
          <h1 className="text-2xl font-bold mb-2">Create Contractor Account</h1>
          <p className="text-[#0F172A] mb-6">Join the verified contractor network.</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Trade Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                value={formData.tradeType}
                onChange={e => setFormData({...formData, tradeType: e.target.value})}
              >
                <option value="PAINTER">Painter</option>
                <option value="GENERAL_CONTRACTOR">General Contractor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3B82F6] text-white py-3 rounded-xl font-medium hover:bg-[#2563EB] disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[#0F172A]">
            Already have an account? <Link href="/signin" className="text-[#0F172A] underline">Sign in</Link>
          </p>
          <p className="mt-2 text-center text-sm text-[#0F172A]">
            Are you a homeowner? <Link href="/homeowner/signup" className="text-[#0F172A] underline">Sign up here</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
