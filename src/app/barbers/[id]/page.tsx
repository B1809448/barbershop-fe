'use client'
// src/app/barbers/[id]/page.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { barbersApi, schedulesApi, unwrap } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { Card, Avatar, StarRating, Badge, Button, Skeleton } from '@/components/ui'
import { DAY_LABELS, formatDuration } from '@/lib/utils'
import type { BarberProfile, AvailableSlotsResponse } from '@/types'
import {
  ArrowLeft, ArrowRight, Scissors, Star, Clock,
  Calendar, ChevronLeft, ChevronRight, MessageSquare,
  CheckCircle2, Phone,
} from 'lucide-react'

export default function BarberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [weekOffset, setWeekOffset] = useState(0)

  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), weekOffset * 7 + i))

  const { data: barber, isLoading } = useQuery({
    queryKey: ['barber', id],
    queryFn: () => barbersApi.getOne(id).then((r) => unwrap<BarberProfile>(r)),
    enabled: !!id,
  })

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', id, selectedDate],
    queryFn: () =>
      schedulesApi.getAvailableSlots(id, { date: selectedDate })
        .then((r) => unwrap<AvailableSlotsResponse>(r)),
    enabled: !!id && !!selectedDate,
  })

  if (isLoading) return <LoadingSkeleton />

  if (!barber) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500">Không tìm thấy thợ cắt tóc</p>
          <Link href="/barbers" className="text-sm text-neutral-900 font-medium mt-2 inline-block hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/barbers"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Tất cả thợ
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: Profile ──────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Main profile card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="relative mb-4">
                    <Avatar
                      name={barber.user?.name ?? 'B'}
                      src={barber.avatarUrl ?? barber.user?.avatarUrl}
                      size="xl"
                    />
                    <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                      barber.isAvailable ? 'bg-green-500' : 'bg-neutral-300'
                    }`} />
                  </div>
                  <h1 className="text-xl font-bold text-neutral-900">{barber.user?.name}</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">{barber.experience} năm kinh nghiệm</p>
                  <div className="mt-2">
                    <StarRating rating={barber.rating} />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{barber.totalReviews} đánh giá</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-neutral-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-neutral-900">{barber.rating.toFixed(1)}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center justify-center gap-1">
                      <Star className="w-3 h-3" /> Rating
                    </p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-neutral-900">{barber.experience}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Năm KN
                    </p>
                  </div>
                </div>

                {barber.bio && (
                  <p className="text-sm text-neutral-600 leading-relaxed mb-5 text-left">
                    {barber.bio}
                  </p>
                )}

                {/* Specialties */}
                {barber.specialties.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Chuyên môn</p>
                    <div className="flex flex-wrap gap-1.5">
                      {barber.specialties.map((s) => (
                        <Badge key={s} className="bg-neutral-100 text-neutral-700 border-neutral-200 text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                {barber.user?.phone && (
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-5">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    {barber.user.phone}
                  </div>
                )}

                <Link href={barber.isAvailable ? `/booking?barberId=${barber.id}` : '#'}>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!barber.isAvailable}
                    icon={<Scissors className="w-4 h-4" />}
                  >
                    {barber.isAvailable ? 'Đặt lịch ngay' : 'Không nhận lịch'}
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Weekly schedule card */}
            {barber.schedules && barber.schedules.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-5">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                    Lịch làm việc
                  </p>
                  <div className="space-y-1.5">
                    {['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map((day) => {
                      const sch = barber.schedules?.find((s) => s.dayOfWeek === day)
                      return (
                        <div key={day} className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${sch?.isWorking ? 'text-neutral-700' : 'text-neutral-300'}`}>
                            {DAY_LABELS[day]}
                          </span>
                          <span className={`text-xs ${sch?.isWorking ? 'text-neutral-600' : 'text-neutral-300'}`}>
                            {sch?.isWorking ? `${sch.startTime} – ${sch.endTime}` : 'Nghỉ'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* ── Right: Slots + Reviews ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Available slots */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <h2 className="font-semibold text-neutral-900">Giờ trống hôm nay & sắp tới</h2>
                </div>

                {/* Day picker */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setWeekOffset((p) => Math.max(0, p - 1))}
                    disabled={weekOffset === 0}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-neutral-500">
                    {format(days[0], 'dd/MM')} — {format(days[6], 'dd/MM')}
                  </span>
                  <button
                    onClick={() => setWeekOffset((p) => p + 1)}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-5">
                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const isActive = selectedDate === dateStr
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center py-2.5 rounded-xl text-xs transition-all ${
                          isActive
                            ? 'bg-neutral-900 text-white'
                            : 'hover:bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <span className={`text-[10px] uppercase mb-1 ${isActive ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          {format(day, 'EEE')}
                        </span>
                        <span className="font-semibold">{format(day, 'd')}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Slots */}
                {slotsLoading ? (
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 rounded-xl" />
                    ))}
                  </div>
                ) : !slots?.slots?.length ? (
                  <div className="py-8 text-center">
                    <Clock className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">
                      {slots?.message ?? 'Không có giờ trống ngày này'}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-neutral-400 mb-3">
                      {slots.availableSlots} slot trống · mỗi slot {formatDuration(slots.slotDuration)}
                    </p>
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                      {slots.slots.map((slot, i) => (
                        <motion.div
                          key={slot.start}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <Link
                            href={`/booking?barberId=${id}&date=${selectedDate}&time=${slot.start}`}
                            className="block text-center py-2 px-1 rounded-xl text-xs font-medium bg-neutral-50 border border-neutral-100 text-neutral-700 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all"
                          >
                            {slot.start}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <Link href={`/booking?barberId=${id}`}>
                        <Button variant="outline" size="sm" className="w-full" icon={<ArrowRight className="w-4 h-4" />}>
                          Đặt lịch đầy đủ
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>

            {/* Reviews */}
            {barber.reviews && barber.reviews.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-neutral-500" />
                      <h2 className="font-semibold text-neutral-900">Đánh giá từ khách hàng</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-neutral-900">{barber.rating.toFixed(1)}</span>
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-neutral-400">({barber.totalReviews})</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {barber.reviews.map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar
                            name={(review as any).booking?.customer?.name ?? 'K'}
                            src={(review as any).booking?.customer?.avatarUrl}
                            size="sm"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-neutral-900">
                                {(review as any).booking?.customer?.name ?? 'Khách hàng'}
                              </p>
                              <span className="text-xs text-neutral-400">
                                {format(new Date(review.createdAt), 'dd/MM/yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5 mb-2">
                              {Array.from({ length: 5 }).map((_, j) => (
                                <Star
                                  key={j}
                                  className={`w-3 h-3 ${j < review.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`}
                                />
                              ))}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-20 h-20 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </Card>
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-24 w-full" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
