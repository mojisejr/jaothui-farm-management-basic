import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { Providers } from './providers'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: {
    default: 'Jaothui | Farm Management System',
    template: '%s | Jaothui',
  },
  description:
    'ระบบจัดการฟาร์มอัจฉริยะสำหรับเกษตรกรรุ่นใหม่ - จัดการสัตว์เลี้ยง กิจกรรม และข้อมูลฟาร์มของคุณอย่างมืออาชีพ',
  keywords: [
    'farm management',
    'livestock management',
    'เกษตร',
    'จัดการฟาร์ม',
    'สัตว์เลี้ยง',
    'การเกษตรอัจฉริยะ',
    'jaothui',
  ],
  authors: [{ name: 'Jaothui Team' }],
  creator: 'Jaothui',
  publisher: 'Jaothui',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://jaothui.com',
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: '/',
    title: 'Jaothui | Farm Management System',
    description: 'ระบบจัดการฟาร์มอัจฉริยะสำหรับเกษตรกรรุ่นใหม่',
    siteName: 'Jaothui',
    images: [
      {
        url: '/images/jaothui-logo.png',
        width: 1200,
        height: 630,
        alt: 'Jaothui Farm Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jaothui | Farm Management System',
    description: 'ระบบจัดการฟาร์มอัจฉริยะสำหรับเกษตรกรรุ่นใหม่',
    images: ['/images/jaothui-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" data-theme="jaothui" className={GeistSans.className}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4AF37" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
