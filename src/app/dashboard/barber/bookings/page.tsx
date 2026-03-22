'use client'
// src/app/dashboard/barber/bookings/page.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { barbersApi, bookingsApi } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, Avatar, Badge, Button, EmptyState, Skeleton, Modal } from '@/components/ui'
import { formatCurrency, formatDuration, STATUS_CONFIG } from '@/lib/utils'
import type { Booking, BookingStatus } from '@/types'
import {
  CalendarDays, Clock, Scissors, Check, X,
  CheckCircle2, ChevronDown, ChevronUp,
  Calendar, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const TABS: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',         label: 'Tất cả' },
  { value: 'PENDING',     label: 'Chờ xác nhận' },
  { value: 'CONFIRMED',   label: 'Đã xác nhận' },
  { value: 'IN_PROGRESS', label: 'Đang làm' },
  { value: 'COMPLETED',   label: 'Hoàn thành' },
  { value: 'CANCELLED',   label: 'Đã huỷ' },
  { value: 'NO_SHOW',     label: 'Không đến' },
]

export default function BarberBookingsPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<BookingStatus | 'ALL'>('ALL')
  const [page, setPage]           = useState(1)
  const [expandId, setExpandId]   = useState<string | null>(null)
  const [rejectId, setRejectId]   = useState<string | null>(null)

  // ── Query ─────────────────────────────────────────────────
  const { data: rawData, isLoading, isFetching } = useQuery({
    queryKey: ['barber-all-bookings', activeTab, page],
    queryFn: async () => {
      const res = await barbersApi.getMyBookings({
        status: activeTab === 'ALL' ? undefined : activeTab,
        page,
        limit: 15,
      })
      // res.data = { success, data: { data: [...], pagination: {...} } }
      const body  = res.data
      return {
        bookings:   (body?.data      ?? []) as Booking[],
        pagination: body?.pagination ?? null,
      }
    },
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const bookings   = rawData?.bookings   ?? []
  const pagination = rawData?.pagination

  // ── Mutation ──────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      bookingsApi.updateStatusBarber(id, { status, cancelReason: reason }),
    onSuccess: (_, vars) => {
      const labels: Record<string, string> = {
        CONFIRMED:   'Đã xác nhận booking',
        CANCELLED:   'Đã từ chối booking',
        IN_PROGRESS: 'Đã bắt đầu dịch vụ',
        COMPLETED:   'Đã hoàn thành',
        NO_SHOW:     'Đã đánh dấu no-show',
      }
      toast.success(labels[vars.status] ?? 'Đã cập nhật')
      qc.invalidateQueries({ queryKey: ['barber-all-bookings'] })
      qc.invalidateQueries({ queryKey: ['barber-bookings'] })
      qc.invalidateQueries({ queryKey: ['barber-stats'] })
      setRejectId(null)
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Lỗi cập nhật trạng thái'),
  })

  // ── Render ────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Quản lý Booking</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {pagination ? `${pagination.total} booking` : '\u00a0'}
          </p>
        </div>
        {isFetching && !isLoading && (
          <span className="text-xs text-neutral-400 animate-pulse">Đang cập nhật...</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1); setExpandId(null) }}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              activeTab === tab.value
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex gap-3 items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-24 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && bookings.length === 0 && (
        <EmptyState
          icon={<CalendarDays className="w-10 h-10" />}
          title="Không có booking nào"
          description="Chưa có booking nào ở trạng thái này"
        />
      )}

      {/* List */}
      {!isLoading && bookings.length > 0 && (
        <>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {bookings.map((booking, i) => {
                const cfg      = STATUS_CONFIG[booking.status]
                const expanded = expandId === booking.id

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow">
                      {/* Main row — clickable to expand */}
                      <button
                        className="w-full text-left p-5"
                        onClick={() => setExpandId(expanded ? null : booking.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar
                            name={booking.customer?.name ?? 'K'}
                            src={booking.customer?.avatarUrl}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-semibold text-neutral-900 text-sm truncate">
                                {booking.customer?.name ?? 'Khách hàng'}
                              </p>
                              <Badge className={`${cfg.bg} ${cfg.color} text-xs shrink-0`}>
                                {cfg.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-500 truncate">
                              {booking.services?.map((s) => s.service?.name).join(' · ')}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(booking.bookingDate), 'EEEE, dd/MM/yyyy', { locale: vi })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {booking.startTime} – {booking.endTime}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <p className="font-bold text-neutral-900 text-sm">
                              {formatCurrency(booking.totalPrice)}
                            </p>
                            {expanded
                              ? <ChevronUp className="w-4 h-4 text-neutral-400" />
                              : <ChevronDown className="w-4 h-4 text-neutral-400" />
                            }
                          </div>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-3 border-t border-neutral-100 space-y-4">
                              {/* Customer info */}
                              {booking.customer?.phone && (
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                  <span className="text-xs text-neutral-400">SĐT:</span>
                                  <a
                                    href={`tel:${booking.customer.phone}`}
                                    className="font-medium hover:text-neutral-900"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {booking.customer.phone}
                                  </a>
                                </div>
                              )}

                              {/* Services breakdown */}
                              <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                                  Dịch vụ
                                </p>
                                <div className="space-y-1.5">
                                  {booking.services?.map((svc) => (
                                    <div key={svc.serviceId} className="flex items-center justify-between text-sm">
                                      <span className="flex items-center gap-2 text-neutral-700">
                                        <Scissors className="w-3.5 h-3.5 text-neutral-400" />
                                        {svc.service?.name}
                                      </span>
                                      <span className="text-neutral-600 font-medium">
                                        {formatCurrency(svc.price)}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100 text-sm font-bold">
                                    <span className="text-neutral-500 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" />
                                      {formatDuration(booking.totalDuration)}
                                    </span>
                                    <span className="text-neutral-900">
                                      {formatCurrency(booking.totalPrice)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Notes */}
                              {booking.notes && (
                                <div className="px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                  <p className="text-xs text-amber-700 font-semibold mb-0.5">Ghi chú của khách</p>
                                  <p className="text-sm text-amber-800 italic">"{booking.notes}"</p>
                                </div>
                              )}

                              {/* Cancel reason */}
                              {booking.cancelReason && (
                                <div className="px-3 py-2 bg-red-50 rounded-xl">
                                  <p className="text-xs text-red-700">
                                    <span className="font-semibold">Lý do huỷ:</span> {booking.cancelReason}
                                  </p>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex gap-2 pt-1 flex-wrap">
                                {booking.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm" variant="outline"
                                      icon={<X className="w-3.5 h-3.5" />}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => setRejectId(booking.id)}
                                    >
                                      Từ chối
                                    </Button>
                                    <Button
                                      size="sm"
                                      icon={<Check className="w-3.5 h-3.5" />}
                                      loading={updateStatus.isPending}
                                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })}
                                    >
                                      Xác nhận
                                    </Button>
                                  </>
                                )}
                                {booking.status === 'CONFIRMED' && (
                                  <>
                                    <Button
                                      size="sm" variant="outline"
                                      icon={<AlertCircle className="w-3.5 h-3.5" />}
                                      className="text-neutral-500"
                                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'NO_SHOW' })}
                                    >
                                      No-show
                                    </Button>
                                    <Button
                                      size="sm" variant="secondary"
                                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'IN_PROGRESS' })}
                                    >
                                      Bắt đầu
                                    </Button>
                                  </>
                                )}
                                {booking.status === 'IN_PROGRESS' && (
                                  <Button
                                    size="sm"
                                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                    onClick={() => updateStatus.mutate({ id: booking.id, status: 'COMPLETED' })}
                                    loading={updateStatus.isPending}
                                  >
                                    Hoàn thành
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <Button
                variant="outline" size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-neutral-500">{page} / {pagination.totalPages}</span>
              <Button
                variant="outline" size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Reject confirm modal */}
      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title="Từ chối booking">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <X className="w-7 h-7 text-red-600" />
          </div>
          <p className="text-sm text-neutral-600">
            Bạn có chắc muốn từ chối booking này?<br />
            Khách hàng sẽ nhận thông báo huỷ lịch.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setRejectId(null)}>
            Huỷ bỏ
          </Button>
          <Button
            variant="danger" className="flex-1"
            loading={updateStatus.isPending}
            onClick={() => rejectId && updateStatus.mutate({
              id: rejectId,
              status: 'CANCELLED',
              reason: 'Thợ từ chối',
            })}
          >
            Xác nhận từ chối
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
