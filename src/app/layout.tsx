// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Inter, DM_Mono } from 'next/font/google'

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
})

const dmMono = DM_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'PhuocDai BarberShop', template: '%s | PhuocDai BarberShop' },
  description: 'Đặt lịch cắt tóc online — nhanh, tiện, chuyên nghiệp',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
