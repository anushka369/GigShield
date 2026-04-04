import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { LanguageProvider } from '@/components/providers/LanguageProvider'

export const metadata: Metadata = {
  title: 'AegiSync — Income Protection for Delivery Partners',
  description:
    'Parametric income insurance for Zomato and Swiggy delivery partners. When disruptions stop your work, AegiSync pays you automatically.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'AegiSync' },
}

export const viewport: Viewport = {
  themeColor: '#FF6B00',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
