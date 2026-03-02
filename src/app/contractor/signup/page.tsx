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

  const tradeTypes = [
    { value: 'PAINTER', label: 'Painter' },
    { value: 'GENERAL_CONTRACTOR', label: 'General Contractor' },
    { value: 'ELECTRICIAN', label: 'Electrician' },
    { value: 'PLUMBER', label: 'Plumber' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'ROOFER', label: 'Roofing' },
    { value: 'CARPENTER', label: 'Carpenter' },
    { value: 'DRYWALL', label: 'Drywall' },
    { value: 'FLOORING', label: 'Flooring' },
    { value: 'LANDSCAPER', label: 'Landscaping' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Trade<span className="text-blue-600">Source</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-900/5 border border-gray-100">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 text-xs font-semibold mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verified Contractor Network
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as Contractor</h1>
              <p className="text-gray-500">Create your account to access quality trade jobs</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Smith"
                    className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  placeholder="Your company (optional)"
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trade Type</label>
                <select
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  value={formData.tradeType}
                  onChange={e => setFormData({...formData, tradeType: e.target.value})}
                >
                  {tradeTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Create Contractor Account'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <Link href="/signin" className="text-blue-600 font-semibold hover:text-blue-700">
                  Sign in
                </Link>
              </p>
              <p className="text-gray-500 text-sm">
                Are you a homeowner?{' '}
                <Link href="/homeowner/signup" className="text-blue-600 font-semibold hover:text-blue-700">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>

          {/* Back */}
          <div className="text-center mt-6">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
