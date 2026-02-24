'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function PostJob() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    county: '',
    jobType: 'FULL',
    workCategory: 'INTERIOR',
    priceType: 'FIXED',
    priceAmount: '',
    isB2C: false,
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: insertError } = await supabase.from('jobs').insert({
        posted_by: user.id,
        title: formData.title,
        description: formData.description,
        county: formData.county,
        job_type: formData.isB2C ? 'B2C_PROJECT' : formData.jobType,
        work_category: formData.workCategory,
        price_type: formData.priceType,
        price_amount: parseFloat(formData.priceAmount) || 0,
        is_b2c: formData.isB2C,
        status: 'OPEN',
      })

      if (insertError) throw insertError

      router.push('/feed')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold">TradeSource</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/feed">Feed</Link>
            <Link href="/post">Post</Link>
            <Link href="/messages">Messages</Link>
            <Link href="/profile">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* B2C Toggle */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="isB2C"
              className="w-5 h-5"
              checked={formData.isB2C}
              onChange={e => setFormData({...formData, isB2C: e.target.checked})}
            />
            <label htmlFor="isB2C" className="font-medium">
              This is a homeowner project (free posting)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Interior painting for 3-bedroom house"
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Provide details about the job..."
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">County *</label>
              <select
                required
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.county}
                onChange={e => setFormData({...formData, county: e.target.value})}
              >
                <option value="">Select county</option>
                <option value="Montgomery">Montgomery</option>
                <option value="Bucks">Bucks</option>
                <option value="Philadelphia">Philadelphia</option>
                <option value="Delaware">Delaware</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Work Category</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.workCategory}
                onChange={e => setFormData({...formData, workCategory: e.target.value})}
              >
                <option value="INTERIOR">Interior</option>
                <option value="EXTERIOR">Exterior</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
          </div>

          {!formData.isB2C && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.jobType}
                  onChange={e => setFormData({...formData, jobType: e.target.value})}
                >
                  <option value="FULL">Full Job</option>
                  <option value="PIECE">Piece Work</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.priceType}
                  onChange={e => setFormData({...formData, priceType: e.target.value})}
                >
                  <option value="FIXED">Fixed Price</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>
            </div>
          )}

          {!formData.isB2C && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Price {formData.priceType === 'HOURLY' ? '(per hour)' : ''}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  required
                  className="w-full pl-7 pr-3 py-2 border rounded-lg"
                  placeholder="0.00"
                  value={formData.priceAmount}
                  onChange={e => setFormData({...formData, priceAmount: e.target.value})}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </main>
    </div>
  )
}
