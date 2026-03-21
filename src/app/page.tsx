'use client'
// src/app/page.tsx
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { barbersApi, servicesApi, unwrap } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { Card, StarRating, Avatar, Badge } from '@/components/ui'
import { formatCurrency, formatDuration } from '@/lib/utils'
import type { BarberProfile, Service } from '@/types'
import {
  Scissors, Clock, Shield, ArrowRight, Star,
  CheckCircle2, Phone, MapPin, Instagram,
} from 'lucide-react'

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export default function HomePage() {
  const { data: barbers } = useQuery({
    queryKey: ['barbers'],
    queryFn: () => barbersApi.getAll({ isAvailable: true }).then((r) => unwrap<BarberProfile[]>(r)),
  })
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll().then((r) => unwrap<Service[]>(r)),
  })

  const featured = barbers?.slice(0, 3) ?? []
  const topServices = services?.slice(0, 6) ?? []

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-neutral-950">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-28">
          <div className="max-w-2xl">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-white/70 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Đặt lịch online 24/7
            </motion.div>

            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-5xl sm:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6">
              Cắt tóc đỉnh,<br />
              <span className="text-neutral-400">không cần chờ đợi</span>
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-neutral-400 text-lg leading-relaxed mb-10 max-w-lg">
              Đặt lịch với thợ ưa thích, chọn giờ phù hợp — tất cả trong vài giây.
              Không gọi điện, không xếp hàng.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-wrap gap-3">
              <Link href="/booking"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-xl font-semibold text-sm hover:bg-neutral-100 transition-colors">
                Đặt lịch ngay <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#barbers"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/15 transition-colors">
                Xem thợ cắt tóc
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="flex items-center gap-8 mt-14 pt-10 border-t border-white/10">
              {[
                { value: '500+', label: 'Khách hàng hài lòng' },
                { value: '4.9★', label: 'Đánh giá trung bình' },
                { value: '5+', label: 'Thợ chuyên nghiệp' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why us ───────────────────────────────────────────── */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <Clock className="w-5 h-5" />, title: 'Đặt trong 30 giây', desc: 'Chọn thợ, dịch vụ, giờ — xong ngay.' },
              { icon: <Shield className="w-5 h-5" />, title: 'Thợ đã được xác thực', desc: 'Chỉ những thợ có kinh nghiệm và đánh giá tốt.' },
              { icon: <Star className="w-5 h-5" />, title: 'Đánh giá thực tế', desc: 'Review từ khách hàng thực — không giả, không ẩn.' },
            ].map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} initial="hidden"
                whileInView="visible" viewport={{ once: true }} custom={i}>
                <Card className="p-6 h-full">
                  <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Barbers ──────────────────────────────────────────── */}
      <section id="barbers" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Đội ngũ</p>
              <h2 className="text-3xl font-bold text-neutral-900">Thợ cắt tóc của chúng tôi</h2>
            </div>
            <Link href="/booking" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
              Đặt lịch ngay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.length > 0 ? featured.map((barber, i) => (
              <motion.div key={barber.id} variants={fadeUp} initial="hidden"
                whileInView="visible" viewport={{ once: true }} custom={i}>
                <Card className="p-6 hover:shadow-lg transition-shadow group">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar name={barber.user?.name ?? 'B'} src={barber.avatarUrl ?? barber.user?.avatarUrl} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900">{barber.user?.name}</h3>
                      <p className="text-sm text-neutral-500">{barber.experience} năm kinh nghiệm</p>
                      <StarRating rating={barber.rating} />
                    </div>
                  </div>
                  {barber.bio && <p className="text-sm text-neutral-600 leading-relaxed mb-4 line-clamp-2">{barber.bio}</p>}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {barber.specialties.slice(0, 3).map((s) => (
                      <Badge key={s} className="bg-neutral-50 text-neutral-600 border-neutral-200 text-xs">{s}</Badge>
                    ))}
                  </div>
                  <Link href={`/booking?barberId=${barber.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors group-hover:gap-3">
                    Đặt lịch <ArrowRight className="w-4 h-4" />
                  </Link>
                </Card>
              </motion.div>
            )) : Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded-lg w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-neutral-100 rounded-xl" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Dịch vụ</p>
            <h2 className="text-3xl font-bold text-neutral-900">Bảng giá dịch vụ</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topServices.map((svc, i) => (
              <motion.div key={svc.id} variants={fadeUp} initial="hidden"
                whileInView="visible" viewport={{ once: true }} custom={i % 3}>
                <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center shrink-0">
                    <Scissors className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 text-sm truncate">{svc.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{formatDuration(svc.duration)}</p>
                  </div>
                  <p className="font-semibold text-neutral-900 text-sm shrink-0">{formatCurrency(svc.price)}</p>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium text-sm hover:bg-neutral-800 transition-colors">
              Đặt lịch ngay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Quy trình</p>
            <h2 className="text-3xl font-bold text-neutral-900">Đặt lịch dễ dàng</h2>
          </div>
          <div className="grid sm:grid-cols-4 gap-6 relative">
            {/* connector line */}
            <div className="hidden sm:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-neutral-100" />
            {[
              { step: '01', title: 'Chọn thợ', desc: 'Xem profile, đánh giá và chuyên môn' },
              { step: '02', title: 'Chọn dịch vụ', desc: 'Một hoặc nhiều dịch vụ kết hợp' },
              { step: '03', title: 'Chọn ngày giờ', desc: 'Xem slot trống theo thời gian thực' },
              { step: '04', title: 'Xác nhận', desc: 'Nhận thông báo xác nhận ngay lập tức' },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} initial="hidden"
                whileInView="visible" viewport={{ once: true }} custom={i}
                className="text-center relative">
                <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center text-sm font-bold mx-auto mb-4 relative z-10">
                  {item.step}
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">{item.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-16 bg-neutral-950 mx-4 sm:mx-6 mb-8 rounded-3xl">
        <div className="text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Sẵn sàng có mái tóc mới?</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">Đặt lịch ngay hôm nay, không cần tạo tài khoản trước.</p>
          <Link href="/booking"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-neutral-900 rounded-xl font-semibold hover:bg-neutral-100 transition-colors">
            Đặt lịch ngay <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="py-12 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">PhuocDai BarberShop</span>
          </div>
          <p className="text-sm text-neutral-400">© 2024 PhuocDai BarberShop. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <Link href="/booking" className="hover:text-neutral-900 transition-colors">Đặt lịch</Link>
            <Link href="/login" className="hover:text-neutral-900 transition-colors">Đăng nhập</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
