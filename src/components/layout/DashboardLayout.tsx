'use client'
// src/components/layout/DashboardLayout.tsx
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/api'
import { Avatar } from '@/components/ui'
import { type ReactNode } from 'react'
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  Settings, LogOut, ChevronRight, Star, Clock, BarChart2,
} from 'lucide-react'
import toast from 'react-hot-toast'

type NavItem = { href: string; label: string; icon: ReactNode }

const customerNav: NavItem[] = [
  { href: '/dashboard/customer',          label: 'Tổng quan',       icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/dashboard/customer/bookings', label: 'Lịch của tôi',    icon: <CalendarDays className="w-4 h-4" /> },
  { href: '/dashboard/customer/profile',  label: 'Hồ sơ',           icon: <Settings className="w-4 h-4" /> },
]

const barberNav: NavItem[] = [
  { href: '/dashboard/barber',            label: 'Tổng quan',       icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/dashboard/barber/bookings',   label: 'Booking',          icon: <CalendarDays className="w-4 h-4" /> },
  { href: '/dashboard/barber/schedule',   label: 'Lịch làm việc',   icon: <Clock className="w-4 h-4" /> },
  { href: '/dashboard/barber/reviews',    label: 'Đánh giá',        icon: <Star className="w-4 h-4" /> },
  { href: '/dashboard/barber/profile',    label: 'Hồ sơ',           icon: <Settings className="w-4 h-4" /> },
]

const adminNav: NavItem[] = [
  { href: '/dashboard/admin',             label: 'Dashboard',       icon: <BarChart2 className="w-4 h-4" /> },
  { href: '/dashboard/admin/bookings',    label: 'Bookings',        icon: <CalendarDays className="w-4 h-4" /> },
  { href: '/dashboard/admin/barbers',     label: 'Thợ cắt tóc',    icon: <Scissors className="w-4 h-4" /> },
  { href: '/dashboard/admin/services',    label: 'Dịch vụ',         icon: <Star className="w-4 h-4" /> },
  { href: '/dashboard/admin/users',       label: 'Người dùng',      icon: <Users className="w-4 h-4" /> },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  const navItems =
    user?.role === 'ADMIN'  ? adminNav  :
    user?.role === 'BARBER' ? barberNav :
                              customerNav

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    router.push('/')
    toast.success('Đã đăng xuất')
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex flex-col w-60 bg-white border-r border-neutral-100 shrink-0"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
          <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm text-neutral-900">PhuocDai BarberShop</span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {item.icon}
                {item.label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        {user && (
          <div className="p-3 border-t border-neutral-100">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{user.name}</p>
                <p className="text-xs text-neutral-500 capitalize">{user.role.toLowerCase()}</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-red-500 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-6 max-w-6xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
