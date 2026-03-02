'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Post {
  id: string
  user_id: string
  category: string
  title: string
  content: string
  created_at: string
  users?: {
    first_name: string
    last_name: string
    company_name: string
  }
  reply_count?: number
}

export default function Community() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPost, setNewPost] = useState({ category: 'GENERAL', title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'BUSINESS', label: 'Business' },
    { key: 'ESTIMATING', label: 'Estimating' },
    { key: 'TOOLS', label: 'Tools' },
    { key: 'HIRING', label: 'Hiring' },
    { key: 'GENERAL', label: 'General' },
  ]

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (userProfile) {
      loadPosts()
    }
  }, [userProfile, activeCategory])

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
    
    setUserProfile(profile)
    setLoading(false)
  }

  const loadPosts = async () => {
    let query = supabase
      .from('community_posts')
      .select('*, users(first_name, last_name, company_name)')
      .order('created_at', { ascending: false })

    if (activeCategory !== 'all') {
      query = query.eq('category', activeCategory)
    }

    const { data } = await query

    if (data) {
      // Get reply counts
      const postsWithCounts = await Promise.all(
        data.map(async (post) => {
          const { count } = await supabase
            .from('community_replies')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
          return { ...post, reply_count: count || 0 }
        })
      )
      setPosts(postsWithCounts)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please fill in title and content')
      return
    }

    // Check if verified
    if (userProfile?.verification_status !== 'APPROVED') {
      alert('Only verified contractors can post. Please complete verification first.')
      return
    }

    setSubmitting(true)

    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      category: newPost.category,
      title: newPost.title,
      content: newPost.content,
    })

    if (error) {
      alert('Error creating post: ' + error.message)
    } else {
      setShowNewPost(false)
      setNewPost({ category: 'GENERAL', title: '', content: '' })
      loadPosts()
    }

    setSubmitting(false)
  }

  const isVerified = userProfile?.verification_status === 'APPROVED'

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-[#0F172A]">TradeSource</Link>
          <nav className="flex gap-4 items-center text-sm">
            <Link href="/feed" className="text-[#0F172A]">Feed</Link>
            <Link href="/contractors" className="text-[#0F172A]">Contractors</Link>
            <Link href="/community" className="text-[#0F172A]">Community</Link>
            <Link href="/jobs/post" className="text-[#0F172A]">Post</Link>
            <Link href="/messages" className="text-[#0F172A]">Messages</Link>
            <Link href="/profile" className="text-[#0F172A]">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A]">Community</h1>
          {isVerified ? (
            <button
              onClick={() => setShowNewPost(true)}
              className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              + New Post
            </button>
          ) : (
            <div className="text-sm text-[#64748B]500">
              🔒 Only verified contractors can post
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                activeCategory === cat.key
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-gray-100 text-[#64748B]700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Access Warning */}
        {!isVerified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800">
              🔒 <strong>Verification required</strong> to post in the community. 
              Complete your verification to unlock.
            </p>
            <Link href="/profile" className="text-blue-600 text-sm underline">
              Go to verification →
            </Link>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]500">
            No posts yet. Be the first to post!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-gray-100 text-[#64748B]700 text-xs px-2 py-1 rounded">
                    {post.category}
                  </span>
                  <span className="text-xs text-[#64748B]500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-[#0F172A] mb-1">{post.title}</h3>
                <p className="text-sm text-[#64748B]600 line-clamp-2 mb-2">{post.content}</p>
                <div className="flex justify-between items-center text-sm text-[#64748B]500">
                  <span>
                    {post.users?.first_name} {post.users?.last_name}
                    {post.users?.company_name && ` - ${post.users.company_name}`}
                  </span>
                  <span>{post.reply_count} replies</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* New Post Modal */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-bold mb-4">New Post</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  >
                    {categories.filter(c => c.key !== 'all').map((cat) => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="What's your topic?"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Share your thoughts..."
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="flex-1 border py-2 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={submitting}
                    className="flex-1 bg-[#0F172A] text-white py-2 rounded-xl font-medium disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
