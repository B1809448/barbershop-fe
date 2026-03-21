'use client'
// src/app/dashboard/customer/page.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { bookingsApi, barbersApi, unwrap } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BookingCard, StatCard, StatusBadge } from '@/components/dashboard/BookingCard'
import { Button, EmptyState, Modal, Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { Booking, PaginatedResponse } from '@/types'
import { CalendarPlus, CalendarDays, CheckCircle2, XCircle, Clock, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function CustomerDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.getMyBookings({ limit: 20 }).then((r) => unwrap<PaginatedResponse<Booking>>(r)),
  })

  const bookings = data?.data ?? []
  const pending   = bookings.filter((b) => b.status === 'PENDING').length
  const completed = bookings.filter((b) => b.status === 'COMPLETED').length
  const totalSpent = bookings.filter((b) => b.status === 'COMPLETED').reduce((s, b) => s + b.totalPrice, 0)

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id, 'Khách huỷ'),
    onSuccess: () => {
      toast.success('Đã huỷ lịch')
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
      setCancelId(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể huỷ'),
  })

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Xin chào, {user?.name} 👋</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Quản lý lịch hẹn của bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Chờ xác nhận"  value={pending}   icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Đã hoàn thành" value={completed} icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Tổng chi tiêu"  value={formatCurrency(totalSpent)} icon={<Star className="w-4 h-4" />} />
      </div>

      {/* Quick action */}
      <Link href="/booking">
        <Card className="p-5 mb-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer bg-neutral-900 border-neutral-800">
          <div>
            <p className="font-semibold text-white">Đặt lịch mới</p>
            <p className="text-sm text-neutral-400 mt-0.5">Chọn thợ, dịch vụ và giờ phù hợp</p>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <CalendarPlus className="w-5 h-5 text-white" />
          </div>
        </Card>
      </Link>

      {/* Bookings list */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-neutral-900">Lịch hẹn gần đây</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-10 h-10" />}
          title="Chưa có lịch hẹn nào"
          description="Đặt lịch đầu tiên của bạn ngay hôm nay"
          action={<Link href="/booking"><Button>Đặt lịch ngay</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, i) => (
            <motion.div key={booking.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <BookingCard
                booking={booking}
                actions={
                  <>
                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <Button variant="danger" size="sm" onClick={() => setCancelId(booking.id)}>Huỷ</Button>
                    )}
                    {booking.status === 'COMPLETED' && !booking.review && (
                      <Button variant="outline" size="sm" icon={<Star className="w-3.5 h-3.5" />}
                        onClick={() => setReviewBooking(booking)}>
                        Đánh giá
                      </Button>
                    )}
                  </>
                }
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Cancel modal */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Xác nhận huỷ lịch">
        <p className="text-sm text-neutral-600 mb-4">Bạn có chắc muốn huỷ lịch hẹn này? Thao tác này không thể hoàn tác.</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setCancelId(null)}>Không</Button>
          <Button variant="danger" className="flex-1" loading={cancelMutation.isPending}
            onClick={() => cancelId && cancelMutation.mutate(cancelId)}>
            Huỷ lịch
          </Button>
        </div>
      </Modal>

      {/* Review modal */}
      <ReviewModal booking={reviewBooking} onClose={() => setReviewBooking(null)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['my-bookings'] }); setReviewBooking(null) }} />
    </DashboardLayout>
  )
}

function ReviewModal({ booking, onClose, onSuccess }: { booking: Booking | null; onClose: () => void; onSuccess: () => void }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!booking) return
    setLoading(true)
    try {
      await barbersApi.createReview(booking.id, { rating, comment })
      toast.success('Cảm ơn bạn đã đánh giá!')
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi gửi đánh giá')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={!!booking} onClose={onClose} title="Đánh giá dịch vụ">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Chất lượng dịch vụ</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}
                className={`w-10 h-10 rounded-xl text-lg transition-all ${s <= rating ? 'bg-amber-400 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-1.5">Nhận xét (tuỳ chọn)</p>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none" />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Huỷ</Button>
          <Button className="flex-1" loading={loading} onClick={submit}>Gửi đánh giá</Button>
        </div>
      </div>
    </Modal>
  )
}
