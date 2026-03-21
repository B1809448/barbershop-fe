'use client'
// src/app/dashboard/admin/page.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { bookingsApi, usersApi, unwrap } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatCard } from '@/components/dashboard/BookingCard'
import { Button, Card, Avatar, Badge } from '@/components/ui'
import { formatCurrency, STATUS_CONFIG } from '@/lib/utils'
import type { DashboardStats, User, PaginatedResponse } from '@/types'
import {
  TrendingUp, TrendingDown, CalendarDays, Users,
  BarChart2, Star, Scissors, ArrowUpRight,
  ShieldCheck, ShieldOff,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const qc = useQueryClient()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => bookingsApi.getDashboard().then((r) => unwrap<DashboardStats>(r)),
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.getAll({ limit: 8, page: 1 }).then((r) => unwrap<PaginatedResponse<User>>(r)),
  })

  const toggleUser = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái tài khoản')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const revenueGrowthPositive = (stats?.overview?.revenueGrowth ?? 0) >= 0

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Tổng quan hoạt động</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Booking hôm nay"   value={stats?.overview?.bookingsToday ?? '—'}       icon={<CalendarDays className="w-4 h-4" />} />
        <StatCard label="Booking tháng này" value={stats?.overview?.bookingsThisMonth ?? '—'}   icon={<BarChart2 className="w-4 h-4" />} />
        <StatCard label="Doanh thu tháng"
          value={formatCurrency(stats?.overview?.revenueThisMonth ?? 0)}
          icon={<TrendingUp className="w-4 h-4" />}
          sub={`${revenueGrowthPositive ? '+' : ''}${stats?.overview?.revenueGrowth ?? 0}% so tháng trước`}
        />
        <StatCard label="Top barber" value={stats?.topBarbers?.[0]?.user?.name ?? '—'} icon={<Star className="w-4 h-4" />}
          sub={`★ ${stats?.topBarbers?.[0]?.rating ?? 0}`} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        {/* Booking by status */}
        <Card className="p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Booking theo trạng thái</h3>
          <div className="space-y-2">
            {stats?.bookingsByStatus && Object.entries(stats.bookingsByStatus).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
              const total = Object.values(stats.bookingsByStatus).reduce((a, b) => a + b, 0)
              const pct = total ? Math.round((count / total) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-neutral-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-neutral-900 rounded-full"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Top services */}
        <Card className="p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Dịch vụ phổ biến</h3>
          <div className="space-y-3">
            {stats?.topServices?.map((svc, i) => (
              <div key={svc.serviceId} className="flex items-center gap-3">
                <span className="w-6 text-xs font-bold text-neutral-400">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{svc.name}</p>
                </div>
                <Badge className="bg-neutral-100 text-neutral-700 border-neutral-200 text-xs">{svc.count} lượt</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card className="p-5 mb-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Booking gần đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-400 uppercase tracking-wide border-b border-neutral-100">
                <th className="pb-3 font-medium">Khách hàng</th>
                <th className="pb-3 font-medium">Thợ</th>
                <th className="pb-3 font-medium">Ngày</th>
                <th className="pb-3 font-medium">Giờ</th>
                <th className="pb-3 font-medium">Giá</th>
                <th className="pb-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {stats?.recentBookings?.slice(0, 8).map((b) => {
                const cfg = STATUS_CONFIG[b.status as keyof typeof STATUS_CONFIG]
                return (
                  <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 font-medium text-neutral-900">{b.customer?.name}</td>
                    <td className="py-3 text-neutral-600">{(b as any).barber?.user?.name}</td>
                    <td className="py-3 text-neutral-600">{format(parseISO(b.bookingDate), 'dd/MM')}</td>
                    <td className="py-3 text-neutral-600">{b.startTime}</td>
                    <td className="py-3 font-medium">{formatCurrency(b.totalPrice)}</td>
                    <td className="py-3">
                      <Badge className={`${cfg.bg} ${cfg.color} text-xs`}>{cfg.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Users management */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900">Người dùng mới nhất</h3>
          <Button variant="ghost" size="sm" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>Xem tất cả</Button>
        </div>
        <div className="space-y-2">
          {usersData?.data?.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
              <Avatar name={u.name} src={u.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{u.name}</p>
                <p className="text-xs text-neutral-500 truncate">{u.email}</p>
              </div>
              <Badge className={`text-xs ${
                u.role === 'ADMIN'  ? 'bg-purple-50 text-purple-700 border-purple-200' :
                u.role === 'BARBER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                     'bg-neutral-100 text-neutral-600 border-neutral-200'
              }`}>{u.role}</Badge>
              <Button
                size="sm" variant="ghost"
                icon={u.isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                onClick={() => toggleUser.mutate(u.id)}
                className={u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
              />
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  )
}
