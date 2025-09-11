// src/components/providers/toast-provider.tsx
'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function ToastProvider() {
  const { theme } = useTheme()
  
  return (
    <Toaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={4000}
    />
  )
}