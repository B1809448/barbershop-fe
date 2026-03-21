'use client'
// src/components/booking/StepConfirm.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { bookingsApi, unwrap } from '@/lib/api'
import { useBookingStore } from '@/store/booking.store'
import { useAuthStore } from '@/store/auth.store'
import { Card, Avatar, Button } from '@/components/ui'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle2, Scissors, Clock, Calendar, User, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export function StepConfirm() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const {
    selectedBarber, selectedServices, selectedDate, selectedSlot, notes,
    setStep, setNotes, reset, getTotalPrice, getTotalDuration,
  } = useBookingStore()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt lịch')
      router.push('/login')
      return
    }
    if (!selectedBarber || !selectedDate || !selectedSlot || selectedServices.length === 0) return

    setLoading(true)
    try {
      await bookingsApi.create({
        barberId:    selectedBarber.id,
        bookingDate: selectedDate,
        startTime:   selectedSlot.start,
        serviceIds:  selectedServices.map((s) => s.id),
        notes,
      })
      setDone(true)
      toast.success('Đặt lịch thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đặt lịch thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Đặt lịch thành công!</h2>
        <p className="text-sm text-neutral-500 mb-8 max-w-xs mx-auto">
          Chúng tôi sẽ xác nhận lịch hẹn của bạn sớm nhất có thể.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={() => { reset(); router.push('/dashboard/customer') }} size="lg">
            Xem lịch của tôi
          </Button>
          <Button variant="outline" onClick={() => { reset(); setDone(false) }} size="lg">
            Đặt lịch mới
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">Xác nhận đặt lịch</h2>
        <p className="text-sm text-neutral-500 mt-1">Kiểm tra thông tin trước khi xác nhận</p>
      </div>

      <div className="space-y-4">
        {/* Barber */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Thợ cắt tóc</p>
          <div className="flex items-center gap-3">
            <Avatar name={selectedBarber?.user?.name ?? 'B'} src={selectedBarber?.avatarUrl ?? selectedBarber?.user?.avatarUrl} size="md" />
            <div>
              <p className="font-semibold text-neutral-900 text-sm">{selectedBarber?.user?.name}</p>
              <p className="text-xs text-neutral-500">{selectedBarber?.experience} năm kinh nghiệm</p>
            </div>
          </div>
        </Card>

        {/* Services */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Dịch vụ</p>
          <div className="space-y-2">
            {selectedServices.map((svc) => (
              <div key={svc.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-neutral-700">
                  <Scissors className="w-3.5 h-3.5 text-neutral-400" />
                  {svc.name}
                </div>
                <span className="font-medium">{formatCurrency(svc.price)}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-sm text-neutral-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />{formatDuration(getTotalDuration())}
              </span>
              <span className="font-bold text-neutral-900">{formatCurrency(getTotalPrice())}</span>
            </div>
          </div>
        </Card>

        {/* Datetime */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Thời gian</p>
          <div className="flex items-center gap-4 text-sm text-neutral-700">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              {selectedDate && format(new Date(selectedDate), 'EEEE, dd/MM/yyyy')}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              {selectedSlot?.start} – {selectedSlot?.end}
            </span>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-5">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />Ghi chú (tuỳ chọn)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Cắt kiểu fade, giữ phần đỉnh dài..."
            rows={3}
            className="w-full mt-2 px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
          />
        </Card>

        {!isAuthenticated && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            Bạn cần <button onClick={() => router.push('/login')} className="font-semibold underline">đăng nhập</button> để hoàn tất đặt lịch.
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => setStep('datetime')} icon={<ArrowLeft className="w-4 h-4" />}>Quay lại</Button>
        <Button onClick={handleConfirm} loading={loading} size="lg" icon={<CheckCircle2 className="w-4 h-4" />}>
          Xác nhận đặt lịch
        </Button>
      </div>
    </div>
  )
}
