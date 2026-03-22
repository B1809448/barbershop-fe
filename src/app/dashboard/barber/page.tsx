'use client'
// src/app/dashboard/barber/page.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { barbersApi, bookingsApi, unwrap } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BookingCard, StatCard } from '@/components/dashboard/BookingCard'
import { Button, EmptyState, Card, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { Booking, PaginatedResponse } from '@/types'
import {
  CalendarDays, CheckCircle2, Clock, TrendingUp,
  Star, Users, Check, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function BarberDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['barber-stats'],
    queryFn: () => barbersApi.getMyStats().then((r) => unwrap<any>(r)),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['barber-bookings', 'upcoming'],
    queryFn: () =>
      barbersApi.getMyBookings({ status: 'PENDING', limit: 20 })
        .then((r) => unwrap<PaginatedResponse<Booking>>(r)),
  })

  const { data: todayData } = useQuery({
    queryKey: ['barber-bookings', 'today'],
    queryFn: () =>
      barbersApi.getMyBookings({ status: 'CONFIRMED', limit: 10 })
        .then((r) => unwrap<PaginatedResponse<Booking>>(r)),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      bookingsApi.updateStatusBarber(id, { status, cancelReason: reason }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái')
      qc.invalidateQueries({ queryKey: ['barber-bookings'] })
      qc.invalidateQueries({ queryKey: ['barber-stats'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Lỗi cập nhật'),
  })

  const pending   = bookingsData?.data ?? []
  const confirmed = todayData?.data ?? []

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Dashboard thợ</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Xin chào, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tháng này"       value={stats?.monthBookings ?? '—'}     icon={<CalendarDays className="w-4 h-4" />} />
        <StatCard label="Hoàn thành"      value={stats?.completedBookings ?? '—'} icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Doanh thu"        value={formatCurrency(stats?.totalRevenue ?? 0)} icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Đánh giá TB"      value={`${stats?.rating ?? '—'}★`}     icon={<Star className="w-4 h-4" />}
          sub={`${stats?.totalReviews ?? 0} lượt đánh giá`} />
      </div>

      {/* Pending confirmations */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-neutral-900">Chờ xác nhận</h2>
          {pending.length > 0 && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200">{pending.length} mới</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />)}
          </div>
        ) : pending.length === 0 ? (
          <EmptyState icon={<Clock className="w-8 h-8" />} title="Không có lịch chờ xác nhận" />
        ) : (
          <div className="space-y-3">
            {pending.map((booking, i) => (
              <motion.div key={booking.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <BookingCard booking={booking} actions={
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"
                      icon={<X className="w-3.5 h-3.5" />}
                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'CANCELLED', reason: 'Thợ từ chối' })}>
                      Từ chối
                    </Button>
                    <Button size="sm"
                      icon={<Check className="w-3.5 h-3.5" />}
                      loading={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })}>
                      Xác nhận
                    </Button>
                  </div>
                } />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Today's confirmed bookings */}
      <div>
        <h2 className="font-semibold text-neutral-900 mb-4">Hôm nay ({confirmed.length} lịch)</h2>
        {confirmed.length === 0 ? (
          <EmptyState icon={<CalendarDays className="w-8 h-8" />} title="Không có lịch đã xác nhận hôm nay" />
        ) : (
          <div className="space-y-3">
            {confirmed.map((booking, i) => (
              <motion.div key={booking.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <BookingCard booking={booking} actions={
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"
                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'IN_PROGRESS' })}>
                      Bắt đầu
                    </Button>
                    <Button size="sm"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'COMPLETED' })}>
                      Xong
                    </Button>
                  </div>
                } />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
