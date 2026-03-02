'use client'

import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Only redirect if trying to access protected pages
      const protectedRoutes = ['/feed', '/profile', '/messages', '/jobs/post', '/contractors']
      const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
      if (isProtected) {
        router.push('/signin')
        return
      }
    }
    
    if (user) setUser(user)
    setLoading(false)
  }

  // Pages that need the bottom nav (when logged in)
  const showBottomNav = user && [
    '/feed', '/profile', '/messages', '/jobs/post', 
    '/contractors', '/community'
  ].some(path => pathname.startsWith(path))

  // Pages without bottom nav (public pages)
  const publicPages = ['/', '/signin', '/contractor/signup', '/homeowner/signup', '/pricing', '/community']
  const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/contractor/')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      {showBottomNav && <BottomNav />}
      
      {/* Add padding to bottom on pages with bottom nav */}
      {showBottomNav && <div className="h-16"></div>}
    </div>
  )
}
