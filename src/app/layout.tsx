import { Inter } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '../components/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Data Maturity Assessment',
  description: 'Assess your organization\'s data maturity level',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}