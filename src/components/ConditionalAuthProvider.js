'use client'

import { usePathname } from 'next/navigation'
import AuthSessionProvider from './SessionProvider'

export default function ConditionalAuthProvider({ children }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <AuthSessionProvider>
        {children}
      </AuthSessionProvider>
    )
  }

  return children
}