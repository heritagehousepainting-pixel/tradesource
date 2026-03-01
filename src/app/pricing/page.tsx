'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function Pricing() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    setProfile(profile)
    setLoading(false)
  }

  const plans = [
    {
      name: 'Basic',
      price: '$19.99',
      period: '/month',
      description: 'For contractors getting started',
      features: [
        '4 active job posts',
        '12 interested responses/month',
        '3 saved searches',
        'Community access',
        'Basic profile',
      ],
      cta: 'Current Plan',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$29.99',
      period: '/month',
      description: 'For growing contractors',
      features: [
        '12 active job posts',
        'Unlimited interested responses',
        '10 saved searches',
        'Community access',
        'Featured profile',
        'Priority support',
      ],
      cta: 'Upgrade',
      popular: true,
    },
    {
      name: 'Premium',
      price: '$39.99',
      period: '/month',
      description: 'For established businesses',
      features: [
        'Unlimited job posts',
        'Unlimited interested responses',
        'Unlimited saved searches',
        'Community access',
        'Featured profile 30 days/year',
        'Early access to features',
        'Dedicated support',
      ],
      cta: 'Upgrade',
      popular: false,
    },
  ]

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const currentTier = profile?.subscription_tier || 'BASIC'
  const isFoundingMember = profile?.founding_member === true

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-black">TradeSource</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed" className="text-black">Feed</Link>
            <Link href="/community" className="text-black">Community</Link>
            <Link href="/profile" className="text-black">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-black mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600">
            Get access to quality trade jobs and grow your business
          </p>
          
          {isFoundingMember && (
            <div className="mt-4 inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
              🎉 Founding Member - 6 months free!
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier === plan.name.toUpperCase()
            
            return (
              <div
                key={plan.name}
                className={`border rounded-2xl p-6 ${
                  plan.popular
                    ? 'border-slate-900 ring-2 ring-slate-900'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="bg-slate-900 text-white text-xs font-medium px-3 py-1 rounded-full inline-block mb-4">
                    MOST POPULAR
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-black">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-black">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-medium ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : plan.popular
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'border-2 border-slate-900 text-slate-900 hover:bg-gray-50'
                  }`}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Founding Member Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="font-bold text-blue-900 mb-2">Founding Member Offer</h3>
          <p className="text-blue-800 text-sm">
            The first 300 verified contractors get <strong>6 months free</strong>, then standard pricing forever.
            {profile?.verification_status === 'APPROVED' && !isFoundingMember && (
              <span className="block mt-2">
                Contact support to activate your founding member discount.
              </span>
            )}
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-black mb-6">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-black mb-2">Can I cancel anytime?</h4>
              <p className="text-sm text-gray-600">Yes, you can cancel your subscription at any time. You'll keep access until the end of your billing period.</p>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">What counts as an "interested response"?</h4>
              <p className="text-sm text-gray-600">When you express interest in a job and the homeowner views your profile, that counts as one interested response.</p>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">Can I upgrade or downgrade?</h4>
              <p className="text-sm text-gray-600">Yes, changes to your plan take effect at the start of your next billing cycle.</p>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-600">We accept all major credit cards through Stripe.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
