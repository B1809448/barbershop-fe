'use client'
// src/app/dashboard/barber/reviews/page.tsx
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { barbersApi, unwrap } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatCard } from '@/components/dashboard/BookingCard'
import { Card, Avatar, EmptyState, Skeleton } from '@/components/ui'
import type { BarberProfile } from '@/types'
import { Star, TrendingUp, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function BarberReviewsPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-barber-profile'],
    queryFn: () => barbersApi.getMyProfile().then((r) => unwrap<BarberProfile>(r)),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Fetch full profile with reviews using the public endpoint
  const { data: fullProfile, isLoading: reviewsLoading } = useQuery({
    queryKey: ['barber-reviews', profile?.id],
    queryFn: () => barbersApi.getOne(profile!.id).then((r) => unwrap<BarberProfile & { reviews: any[] }>(r)),
    enabled: !!profile?.id,
  })

  const reviews = (fullProfile as any)?.reviews ?? []

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
  }))
  const totalReviews = reviews.length

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Đánh giá của tôi</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{totalReviews} đánh giá từ khách hàng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Rating TB"    value={`${profile?.rating ?? 0}★`}      icon={<Star className="w-4 h-4" />} />
        <StatCard label="Tổng đánh giá" value={profile?.totalReviews ?? 0}      icon={<MessageSquare className="w-4 h-4" />} />
        <StatCard label="5 sao"        value={ratingDist[0].count}              icon={<TrendingUp className="w-4 h-4" />} />
      </div>

      {/* Rating distribution */}
      {totalReviews > 0 && (
        <Card className="p-5 mb-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Phân bố đánh giá</h2>
          <div className="space-y-2.5">
            {ratingDist.map(({ star, count }) => {
              const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-700 w-8 text-right">{star}★</span>
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: (5 - star) * 0.08 }}
                      className={`h-full rounded-full ${
                        star >= 4 ? 'bg-amber-400' : star === 3 ? 'bg-neutral-400' : 'bg-red-400'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 w-10">{count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Reviews list */}
      {isLoading || reviewsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="w-10 h-10" />}
          title="Chưa có đánh giá nào"
          description="Hoàn thành các booking để nhận đánh giá từ khách hàng"
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {reviews.map((review: any, i: number) => (
            <motion.div key={review.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <Card className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={review.booking?.customer?.name ?? 'Khách'}
                      src={review.booking?.customer?.avatarUrl}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {review.booking?.customer?.name ?? 'Khách hàng'}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <span key={s} className={`text-base ${s < review.rating ? 'text-amber-400' : 'text-neutral-200'}`}>★</span>
                    ))}
                  </div>
                </div>
                {review.comment ? (
                  <p className="text-sm text-neutral-600 leading-relaxed">"{review.comment}"</p>
                ) : (
                  <p className="text-sm text-neutral-400 italic">Không có nhận xét</p>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
