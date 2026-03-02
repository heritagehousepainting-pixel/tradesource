import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#0F172A]">TradeSource</h1>
          <nav className="flex gap-6 items-center">
            <Link href="/signin" className="text-[#0F172A] hover:text-[#3B82F6] font-medium transition-colors">Sign In</Link>
            <Link href="/contractor/signup" className="bg-[#0F172A] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E293B] transition-all shadow-md">
              Contractor Sign Up
            </Link>
            <Link href="/homeowner/signup" className="text-[#0F172A] hover:text-[#3B82F6] font-medium transition-colors">
              Homeowner? Post Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-[#0F172A] mb-6 leading-tight">
            The Job Exchange for<br />Construction Trades
          </h2>
          <p className="text-xl text-[#64748B] mb-10 max-w-2xl mx-auto">
            A private network for verified contractors to share overflow work, 
            find reliable subs, and grow your business.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/contractor/signup" className="bg-[#3B82F6] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#2563EB] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Get Started
            </Link>
            <Link href="/homeowner/signup" className="border-2 border-[#0F172A] text-[#0F172A] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#0F172A] hover:text-white transition-all">
              Post a Project
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-16 text-[#0F172A]">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-[#3B82F6]">1</div>
              <h4 className="text-xl font-bold mb-3 text-[#0F172A]">Request Access</h4>
              <p className="text-[#64748B]">Contractors apply and get verified. Homeowners sign up free.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-[#3B82F6]">2</div>
              <h4 className="text-xl font-bold mb-3 text-[#0F172A]">Post or Browse Jobs</h4>
              <p className="text-[#64748B]">Post overflow work or find jobs in your trade and area.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-[#3B82F6]">3</div>
              <h4 className="text-xl font-bold mb-3 text-[#0F172A]">Connect & Get Work</h4>
              <p className="text-[#64748B]">Express interest, chat, and complete the job. Leave reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl p-10 shadow-lg">
            <h3 className="text-2xl font-bold mb-8 text-[#0F172A]">Why TradeSource Works</h3>
            <ul className="space-y-5">
              <li className="flex items-center gap-4 text-[#0F172A]">
                <span className="text-[#10B981] text-xl">✓</span>
                <span><strong>Vetted Contractors</strong> — Everyone is verified before participating</span>
              </li>
              <li className="flex items-center gap-4 text-[#0F172A]">
                <span className="text-[#10B981] text-xl">✓</span>
                <span><strong>No Bidding</strong> — Fixed prices, professional exchanges</span>
              </li>
              <li className="flex items-center gap-4 text-[#0F172A]">
                <span className="text-[#10B981] text-xl">✓</span>
                <span><strong>Job-Scoped Messaging</strong> — All conversations tied to specific jobs</span>
              </li>
              <li className="flex items-center gap-4 text-[#0F172A]">
                <span className="text-[#10B981] text-xl">✓</span>
                <span><strong>Reviews & History</strong> — Build your reputation with real completed jobs</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-6xl mx-auto px-4 text-center text-[#64748B]">
          <p>© 2026 TradeSource. The job exchange for construction trades.</p>
        </div>
      </footer>
    </div>
  )
}
