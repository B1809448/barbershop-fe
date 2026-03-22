'use client'
// src/app/dashboard/admin/bookings/page.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { bookingsApi, unwrap } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BookingCard } from '@/components/dashboard/BookingCard'
import { Button, Badge, EmptyState } from '@/components/ui'
import { STATUS_CONFIG } from '@/lib/utils'
import type { Booking, BookingStatus, PaginatedResponse } from '@/types'
import { CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'

const STATUS_TABS: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',        label: 'Tất cả' },
  { value: 'PENDING',    label: 'Chờ xác nhận' },
  { value: 'CONFIRMED',  label: 'Đã xác nhận' },
  { value: 'IN_PROGRESS',label: 'Đang làm' },
  { value: 'COMPLETED',  label: 'Hoàn thành' },
  { value: 'CANCELLED',  label: 'Đã huỷ' },
]

export default function AdminBookingsPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<BookingStatus | 'ALL'>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', activeTab],
    queryFn: () =>
      bookingsApi.getAllAdmin({ status: activeTab === 'ALL' ? undefined : activeTab, limit: 20 })
        .then((r) => unwrap<PaginatedResponse<Booking>>(r)),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingsApi.updateStatusAdmin(id, { status }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái')
      qc.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Lỗi cập nhật'),
  })

  const bookings = data?.data ?? []

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Quản lý Bookings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{data?.pagination?.total ?? 0} bookings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.value
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-10 h-10" />} title="Không có booking nào" />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, i) => (
            <motion.div key={booking.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <BookingCard booking={booking} actions={
                <div className="flex gap-1.5 flex-wrap">
                  {booking.status === 'PENDING' && (
                    <>
                      <Button size="sm" variant="outline"
                        onClick={() => updateStatus.mutate({ id: booking.id, status: 'CANCELLED' })}>
                        Huỷ
                      </Button>
                      <Button size="sm"
                        onClick={() => updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })}>
                        Xác nhận
                      </Button>
                    </>
                  )}
                  {booking.status === 'CONFIRMED' && (
                    <Button size="sm"
                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'COMPLETED' })}>
                      Hoàn thành
                    </Button>
                  )}
                </div>
              } />
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
