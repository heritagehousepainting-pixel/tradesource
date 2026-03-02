import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Trade<span className="text-blue-600">Source</span>
          </h1>
          <nav className="flex gap-8 items-center">
            <Link href="/signin" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm">
              Sign In
            </Link>
            <Link href="/contractor/signup" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Contractor Sign Up
            </Link>
            <Link href="/homeowner/signup" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
              Post Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-50 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            Trusted by 500+ Contractors
          </div>
          
          <h2 className="text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            The Professional<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
              Job Exchange
            </span>
            <br />for Construction Trades
          </h2>
          
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with vetted contractors, share overflow work, and grow your business 
            through our exclusive professional network.
          </p>
          
          <div className="flex justify-center gap-4">
            <Link href="/contractor/signup" className="bg-blue-600 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
              Get Started Free →
            </Link>
            <Link href="/homeowner/signup" className="bg-white text-gray-900 border-2 border-gray-200 px-10 py-5 rounded-2xl text-lg font-bold hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all">
              Post a Project
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-gray-400 text-sm font-medium">Verified Contractors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">$2M+</div>
              <div className="text-gray-400 text-sm font-medium">Jobs Posted</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-gray-400 text-sm font-medium">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h3>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-8 bg-gray-50 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="mt-4">
                <h4 className="text-xl font-bold text-gray-900 mb-3">Request Access</h4>
                <p className="text-gray-500">
                  Contractors apply and get verified. Homeowners sign up free with no obligations.
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative p-8 bg-gray-50 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <div className="mt-4">
                <h4 className="text-xl font-bold text-gray-900 mb-3">Post or Browse Jobs</h4>
                <p className="text-gray-500">
                  Post overflow work or find quality jobs in your trade and service area.
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative p-8 bg-gray-50 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="mt-4">
                <h4 className="text-xl font-bold text-gray-900 mb-3">Connect & Get Work</h4>
                <p className="text-gray-500">
                  Express interest, chat, complete the job, and build your reputation with reviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why TradeSource */}
      <section className="py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-3xl p-12 shadow-xl shadow-gray-900/5">
            <h3 className="text-3xl font-bold text-center mb-10 text-gray-900">
              Why Contractors Choose TradeSource
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Vetted Contractors</h4>
                  <p className="text-gray-500 text-sm">Every member is verified before participating</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">No Bidding Wars</h4>
                  <p className="text-gray-500 text-sm">Fixed prices, professional exchanges only</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Job-Scoped Messaging</h4>
                  <p className="text-gray-500 text-sm">All conversations tied to specific jobs</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Verified Reviews</h4>
                  <p className="text-gray-500 text-sm">Build reputation with real completed jobs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            Ready to Grow Your Business?
          </h3>
          <p className="text-blue-100 text-lg mb-8">
            Join hundreds of contractors already using TradeSource
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/contractor/signup" className="bg-white text-blue-600 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-gray-100 transition-all shadow-xl">
              Get Started Free
            </Link>
            <Link href="/homeowner/signup" className="bg-blue-800 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:bg-blue-900 transition-all border border-blue-500">
              Post a Project
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2026 TradeSource. The professional job exchange for construction trades.
          </p>
        </div>
      </footer>
    </div>
  )
}
