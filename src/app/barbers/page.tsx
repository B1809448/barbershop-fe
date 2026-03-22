'use client'
// src/app/barbers/page.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { barbersApi, unwrap } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { Card, Avatar, StarRating, Badge, Input, Skeleton } from '@/components/ui'
import type { BarberProfile } from '@/types'
import {
  Search, ArrowRight, Scissors, Star,
  Clock, CheckCircle2, SlidersHorizontal,
} from 'lucide-react'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export default function BarbersPage() {
  const [search, setSearch] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  const { data: barbers, isLoading } = useQuery({
    queryKey: ['barbers-public'],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: () => barbersApi.getAll({}).then((r) => unwrap<BarberProfile[]>(r)),
  })

  const filtered = barbers?.filter((b) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      b.user?.name?.toLowerCase().includes(q) ||
      b.bio?.toLowerCase().includes(q) ||
      b.specialties.some((s) => s.toLowerCase().includes(q))
    const matchAvail = !onlyAvailable || b.isAvailable
    return matchSearch && matchAvail
  }) ?? []

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <section className="bg-neutral-950 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Đội ngũ</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Thợ cắt tóc<br />
              <span className="text-neutral-500">chuyên nghiệp</span>
            </h1>
            <p className="text-neutral-400 max-w-md leading-relaxed">
              Mỗi thợ đều có kỹ năng riêng — chọn người phù hợp nhất với phong cách của bạn.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, chuyên môn..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 placeholder:text-neutral-400"
            />
          </div>
          <button
            onClick={() => setOnlyAvailable((p) => !p)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              onlyAvailable
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đang nhận lịch
          </button>
          <span className="text-xs text-neutral-400 ml-auto hidden sm:block">
            {filtered.length} thợ
          </span>
        </div>
      </div>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="font-semibold text-neutral-700">Không tìm thấy thợ phù hợp</p>
            <p className="text-sm text-neutral-400 mt-1">Thử thay đổi từ khoá tìm kiếm</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((barber, i) => (
              <motion.div
                key={barber.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <BarberCard barber={barber} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function BarberCard({ barber }: { barber: BarberProfile }) {
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Top section */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <Avatar
              name={barber.user?.name ?? 'B'}
              src={barber.avatarUrl ?? barber.user?.avatarUrl}
              size="xl"
            />
            {/* Available dot */}
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
              barber.isAvailable ? 'bg-green-500' : 'bg-neutral-300'
            }`} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-neutral-900 text-base leading-tight">{barber.user?.name}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{barber.experience} năm kinh nghiệm</p>
            <div className="mt-1.5">
              <StarRating rating={barber.rating} />
            </div>
          </div>
        </div>

        {barber.bio && (
          <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2 mb-4">{barber.bio}</p>
        )}

        {/* Specialties */}
        {barber.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {barber.specialties.slice(0, 4).map((s) => (
              <Badge key={s} className="bg-neutral-50 text-neutral-600 border-neutral-200 text-xs">
                {s}
              </Badge>
            ))}
            {barber.specialties.length > 4 && (
              <Badge className="bg-neutral-50 text-neutral-500 border-neutral-200 text-xs">
                +{barber.specialties.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-neutral-100">
          <div className="text-center">
            <p className="text-sm font-bold text-neutral-900">{barber.rating.toFixed(1)}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Đánh giá</p>
          </div>
          <div className="text-center border-x border-neutral-100">
            <p className="text-sm font-bold text-neutral-900">{barber.totalReviews}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-neutral-900">{barber.experience}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Năm KN</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex gap-2">
        <Link
          href={`/barbers/${barber.id}`}
          className="flex-1 py-2.5 text-center rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Xem chi tiết
        </Link>
        <Link
          href={`/booking?barberId=${barber.id}`}
          className={`flex-1 py-2.5 text-center rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            barber.isAvailable
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          {barber.isAvailable ? (
            <> Đặt lịch <ArrowRight className="w-3.5 h-3.5" /></>
          ) : (
            'Không nhận lịch'
          )}
        </Link>
      </div>
    </Card>
  )
}
