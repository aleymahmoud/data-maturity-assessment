import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalAuthProvider from '../components/ConditionalAuthProvider'
import GoogleAnalytics from './components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Omnisight Analytics | Data-Driven Insights & Solutions',
  description: 'Transform your organization with data-driven insights. Comprehensive data strategy, analytics, governance, and maturity assessment tools.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        <ConditionalAuthProvider>
          {children}
        </ConditionalAuthProvider>
      </body>
    </html>
  )
}