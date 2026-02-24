import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">TradeSource</h1>
          <nav className="flex gap-6 items-center">
            <Link href="/signin" className="text-slate-600 hover:text-slate-900">Sign In</Link>
            <Link href="/contractor/signup" className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
              Contractor Sign Up
            </Link>
            <Link href="/homeowner/signup" className="text-slate-600 hover:text-slate-900">
              Homeowner? Post Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            The Job Exchange for Construction Trades
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            A private network for verified contractors to share overflow work, 
            find reliable subs, and grow your business.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/contractor/signup" className="bg-slate-900 text-white px-6 py-3 rounded-lg text-lg hover:bg-slate-800">
              Get Started
            </Link>
            <Link href="/homeowner/signup" className="border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-lg text-lg hover:bg-slate-50">
              Post a Project
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h4 className="font-semibold mb-2">Request Access</h4>
              <p className="text-slate-600">Contractors apply and get verified. Homeowners sign up free.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h4 className="font-semibold mb-2">Post or Browse Jobs</h4>
              <p className="text-slate-600">Post overflow work or find jobs in your trade and area.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h4 className="font-semibold mb-2">Connect & Get Work</h4>
              <p className="text-slate-600">Express interest, chat, and complete the job. Leave reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-6">Why TradeSource Works</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-green-600">✓</span>
                <span><strong>Vetted Contractors</strong> — Everyone is verified before participating</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600">✓</span>
                <span><strong>No Bidding</strong> — Fixed prices, professional exchanges</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600">✓</span>
                <span><strong>Job-Scoped Messaging</strong> — All conversations tied to specific jobs</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600">✓</span>
                <span><strong>Reviews & History</strong> — Build your reputation with real completed jobs</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500">
          <p>© 2026 TradeSource. The job exchange for construction trades.</p>
        </div>
      </footer>
    </div>
  )
}
