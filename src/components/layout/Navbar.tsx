'use client'
// src/components/layout/Navbar.tsx
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/api'
import { Avatar, Button } from '@/components/ui'
import { useState } from 'react'
import { Scissors, Menu, X, LogOut, User, LayoutDashboard, CalendarPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    router.push('/')
    toast.success('Đã đăng xuất')
  }

  const dashboardHref =
    user?.role === 'ADMIN'   ? '/dashboard/admin' :
    user?.role === 'BARBER'  ? '/dashboard/barber' :
                               '/dashboard/customer'

  const navLinks = [
    { href: '/',        label: 'Trang chủ' },
    { href: '/barbers', label: 'Thợ cắt tóc' },
    { href: '/booking', label: 'Đặt lịch' },
  ]

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-neutral-900 text-sm tracking-tight">PhuocDai BarberShop</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push(dashboardHref)} icon={<LayoutDashboard className="w-4 h-4" />} className="hidden md:inline-flex">
                Dashboard
              </Button>
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-100">
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <span className="hidden md:block text-sm font-medium text-neutral-800 max-w-[120px] truncate">{user.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />} className="hidden md:inline-flex text-neutral-500" />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>Đăng nhập</Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/register')}>Đăng ký</Button>
            </>
          )}
          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-neutral-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-neutral-100 bg-white px-4 py-3 space-y-1"
        >
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {l.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link href={dashboardHref} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50">Đăng nhập</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50">Đăng ký</Link>
            </>
          )}
        </motion.div>
      )}
    </motion.header>
  )
}
