'use client'
// src/app/dashboard/customer/bookings/page.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { bookingsApi, barbersApi, unwrap } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, Avatar, Badge, Button, EmptyState, Modal, Skeleton } from '@/components/ui'
import { formatCurrency, formatDuration, STATUS_CONFIG } from '@/lib/utils'
import type { Booking, BookingStatus, PaginatedResponse } from '@/types'
import {
  CalendarDays, Clock, Scissors, Star,
  XCircle, ChevronDown, ChevronUp, Calendar,
  Filter, CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_TABS: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',         label: 'Tất cả' },
  { value: 'PENDING',     label: 'Chờ xác nhận' },
  { value: 'CONFIRMED',   label: 'Đã xác nhận' },
  { value: 'IN_PROGRESS', label: 'Đang làm' },
  { value: 'COMPLETED',   label: 'Hoàn thành' },
  { value: 'CANCELLED',   label: 'Đã huỷ' },
]

export default function CustomerBookingsPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab]   = useState<BookingStatus | 'ALL'>('ALL')
  const [page, setPage]             = useState(1)
  const [expandId, setExpandId]     = useState<string | null>(null)
  const [cancelId, setCancelId]     = useState<string | null>(null)
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customer-bookings', activeTab, page],
    queryFn: () =>
      bookingsApi.getMyBookings({
        status: activeTab === 'ALL' ? undefined : activeTab,
        page,
        limit: 10,
      }).then((r) => unwrap<PaginatedResponse<Booking>>(r)),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id, 'Khách huỷ'),
    onSuccess: () => {
      toast.success('Đã huỷ lịch hẹn')
      qc.invalidateQueries({ queryKey: ['customer-bookings'] })
      setCancelId(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể huỷ lúc này'),
  })

  const bookings   = data?.data ?? []
  const pagination = data?.pagination

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Lịch hẹn của tôi</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {pagination?.total ?? 0} lịch hẹn
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {STATUS_TABS.map((tab) => {
          const cfg = tab.value !== 'ALL' ? STATUS_CONFIG[tab.value] : null
          return (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1) }}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                activeTab === tab.value
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex gap-3 items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-10 h-10" />}
          title="Không có lịch hẹn nào"
          description={activeTab === 'ALL' ? 'Đặt lịch cắt tóc đầu tiên của bạn' : 'Không có lịch ở trạng thái này'}
          action={
            activeTab === 'ALL' ? (
              <Link href="/booking">
                <Button icon={<Calendar className="w-4 h-4" />}>Đặt lịch ngay</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {bookings.map((booking, i) => {
              const cfg     = STATUS_CONFIG[booking.status]
              const expanded = expandId === booking.id
              const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status)
              const canReview = booking.status === 'COMPLETED' && !booking.review

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    {/* Main row */}
                    <button
                      className="w-full text-left p-5"
                      onClick={() => setExpandId(expanded ? null : booking.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={booking.barber?.user?.name ?? 'B'}
                          src={booking.barber?.user?.avatarUrl}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-neutral-900 text-sm truncate">
                              {booking.barber?.user?.name}
                            </p>
                            <Badge className={`${cfg.bg} ${cfg.color} text-xs shrink-0`}>
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-500 truncate">
                            {booking.services.map((s) => s.service.name).join(' · ')}
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
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
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
                          <div className="px-5 pb-5 border-t border-neutral-100 pt-4 space-y-4">
                            {/* Services breakdown */}
                            <div>
                              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                                Dịch vụ
                              </p>
                              <div className="space-y-1.5">
                                {booking.services.map((svc) => (
                                  <div key={svc.serviceId} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-neutral-700">
                                      <Scissors className="w-3.5 h-3.5 text-neutral-400" />
                                      {svc.service.name}
                                    </span>
                                    <span className="text-neutral-600 font-medium">
                                      {formatCurrency(svc.price)}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100 text-sm font-bold">
                                  <span className="flex items-center gap-2 text-neutral-500">
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
                              <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">
                                  Ghi chú
                                </p>
                                <p className="text-sm text-neutral-600 italic">"{booking.notes}"</p>
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

                            {/* Review */}
                            {booking.review && (
                              <div className="px-3 py-3 bg-amber-50 rounded-xl">
                                <p className="text-xs font-semibold text-neutral-600 mb-1">Đánh giá của bạn</p>
                                <div className="flex items-center gap-1 mb-1">
                                  {Array.from({ length: 5 }).map((_, j) => (
                                    <Star key={j} className={`w-3.5 h-3.5 ${j < booking.review!.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`} />
                                  ))}
                                </div>
                                {booking.review.comment && (
                                  <p className="text-xs text-neutral-600">"{booking.review.comment}"</p>
                                )}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-1">
                              {canCancel && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<XCircle className="w-3.5 h-3.5" />}
                                  onClick={() => setCancelId(booking.id)}
                                >
                                  Huỷ lịch
                                </Button>
                              )}
                              {canReview && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<Star className="w-3.5 h-3.5" />}
                                  onClick={() => setReviewBooking(booking)}
                                >
                                  Đánh giá
                                </Button>
                              )}
                              {booking.status === 'COMPLETED' && (
                                <Link href={`/booking?barberId=${booking.barberId}`}>
                                  <Button variant="secondary" size="sm" icon={<Calendar className="w-3.5 h-3.5" />}>
                                    Đặt lại
                                  </Button>
                                </Link>
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

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Trước
              </Button>
              <span className="text-sm text-neutral-500">{page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Sau
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Cancel confirm modal */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Xác nhận huỷ lịch">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-7 h-7 text-red-600" />
          </div>
          <p className="text-sm text-neutral-600">
            Bạn có chắc muốn huỷ lịch hẹn này không?<br />
            Lưu ý: chỉ có thể huỷ trước giờ hẹn ít nhất <strong>2 tiếng</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setCancelId(null)}>
            Giữ lịch
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={cancelMut.isPending}
            onClick={() => cancelId && cancelMut.mutate(cancelId)}
          >
            Huỷ lịch
          </Button>
        </div>
      </Modal>

      {/* Review modal */}
      <ReviewModal
        booking={reviewBooking}
        onClose={() => setReviewBooking(null)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['customer-bookings'] })
          setReviewBooking(null)
        }}
      />
    </DashboardLayout>
  )
}

// ── Review Modal ──────────────────────────────────────────────
function ReviewModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [rating, setRating]   = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!booking) return
    setLoading(true)
    try {
      await barbersApi.createReview(booking.id, { rating, comment })
      toast.success('Cảm ơn bạn đã đánh giá!')
      setComment('')
      setRating(5)
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi gửi đánh giá')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={!!booking} onClose={onClose} title="Đánh giá dịch vụ">
      {booking && (
        <div className="space-y-5">
          {/* Barber info */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
            <Avatar name={booking.barber?.user?.name ?? 'B'} src={booking.barber?.user?.avatarUrl} size="sm" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">{booking.barber?.user?.name}</p>
              <p className="text-xs text-neutral-500">
                {booking.services.map((s) => s.service.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Stars */}
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-3 text-center">Bạn đánh giá dịch vụ như thế nào?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      s <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 fill-neutral-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-neutral-400 mt-2">
              {['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Xuất sắc'][rating]}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Nhận xét <span className="text-neutral-400 font-normal">(tuỳ chọn)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn với thợ này..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none placeholder:text-neutral-400"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Huỷ
            </Button>
            <Button className="flex-1" loading={loading} icon={<CheckCircle2 className="w-4 h-4" />} onClick={submit}>
              Gửi đánh giá
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
