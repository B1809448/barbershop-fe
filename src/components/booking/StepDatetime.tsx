'use client'
// src/components/booking/StepDatetime.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, addDays, isSameDay, isToday, isPast, startOfDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import { schedulesApi, unwrap } from '@/lib/api'
import { useBookingStore } from '@/store/booking.store'
import { Button, EmptyState } from '@/components/ui'
import { ArrowRight, ArrowLeft, Clock, ChevronLeft, ChevronRight, CalendarX } from 'lucide-react'
import type { AvailableSlotsResponse, TimeSlot } from '@/types'

export function StepDatetime() {
  const { selectedBarber, selectedDate, selectedSlot, setDate, setSlot, setStep, getTotalDuration } = useBookingStore()
  const [weekOffset, setWeekOffset] = useState(0)
  const duration = getTotalDuration()

  // Generate 7 days starting from today + weekOffset*7
  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), weekOffset * 7 + i))

  const activeDate = selectedDate ? new Date(selectedDate) : null

  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['slots', selectedBarber?.id, selectedDate, duration],
    queryFn: () => schedulesApi
      .getAvailableSlots(selectedBarber!.id, { date: selectedDate, duration })
      .then((r) => unwrap<AvailableSlotsResponse>(r)),
    enabled: !!selectedBarber && !!selectedDate,
  })

  const handleDayClick = (day: Date) => {
    if (isPast(startOfDay(day)) && !isToday(day)) return
    setDate(format(day, 'yyyy-MM-dd'))
  }

  const handleSlotClick = (slot: TimeSlot) => setSlot(slot)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">Chọn ngày & giờ</h2>
        <p className="text-sm text-neutral-500 mt-1">Xem lịch trống của thợ</p>
      </div>

      {/* Week picker */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setWeekOffset((p) => Math.max(0, p - 1))} disabled={weekOffset === 0}
            className="p-2 rounded-xl hover:bg-neutral-100 disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-neutral-700">
            {format(days[0], 'dd/MM')} — {format(days[6], 'dd/MM/yyyy')}
          </span>
          <button onClick={() => setWeekOffset((p) => p + 1)}
            className="p-2 rounded-xl hover:bg-neutral-100 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const past     = isPast(startOfDay(day)) && !isToday(day)
            const selected = activeDate && isSameDay(day, activeDate)
            const today    = isToday(day)
            return (
              <button key={day.toString()} onClick={() => handleDayClick(day)} disabled={past}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-xs transition-all ${
                  past    ? 'opacity-30 cursor-not-allowed' :
                  selected? 'bg-neutral-900 text-white' :
                  today   ? 'bg-neutral-100 text-neutral-900 font-semibold' :
                            'hover:bg-neutral-50 text-neutral-700'
                }`}>
                <span className="text-[10px] uppercase mb-1">{format(day, 'EEE', { locale: vi })}</span>
                <span className="font-semibold">{format(day, 'd')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4">
        {!selectedDate ? (
          <EmptyState icon={<CalendarX className="w-8 h-8" />} title="Chọn ngày để xem giờ trống" />
        ) : isLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : !slotsData?.slots?.length ? (
          <EmptyState icon={<Clock className="w-8 h-8" />}
            title="Không có giờ trống"
            description={slotsData?.message ?? 'Vui lòng chọn ngày khác'} />
        ) : (
          <>
            <p className="text-xs text-neutral-500 mb-3">
              {slotsData.availableSlots} slot trống · {duration} phút/lượt
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {slotsData.slots.map((slot, i) => {
                const active = selectedSlot?.start === slot.start
                return (
                  <motion.button key={slot.start} onClick={() => handleSlotClick(slot)}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-100'
                    }`}>
                    {slot.start}
                  </motion.button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {selectedSlot && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200 text-sm text-neutral-700">
          Đã chọn: <span className="font-semibold">{selectedSlot.start} – {selectedSlot.end}</span>
          {selectedDate && <> · <span className="font-semibold">{format(new Date(selectedDate), 'dd/MM/yyyy')}</span></>}
        </motion.div>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => setStep('service')} icon={<ArrowLeft className="w-4 h-4" />}>Quay lại</Button>
        <Button disabled={!selectedSlot} onClick={() => setStep('confirm')} icon={<ArrowRight className="w-4 h-4" />} size="lg">Tiếp theo</Button>
      </div>
    </div>
  )
}
