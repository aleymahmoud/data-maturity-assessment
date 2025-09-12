'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import AdminSidebarLayout from './AdminSidebarLayout'

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect if we're on the login page
    if (pathname === '/admin/login') {
      return
    }

    // Redirect to login if not authenticated
    if (status === 'loading') return // Still checking
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/admin/login')
    }
  }, [session, status, router, pathname])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #2563eb',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ color: '#6b7280' }}>Loading...</span>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Don't wrap login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Show login page if not authenticated
  if (!session || session.user?.role !== 'admin') {
    return null // Will redirect via useEffect
  }

  // Wrap authenticated admin pages with sidebar layout
  return (
    <AdminSidebarLayout>
      {children}
    </AdminSidebarLayout>
  )
}