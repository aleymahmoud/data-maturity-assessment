import './globals.css'

export const metadata = {
  title: 'Data Maturity Assessment Tool',
  description: 'Evaluate your organization\'s data capabilities across 11 key dimensions',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}