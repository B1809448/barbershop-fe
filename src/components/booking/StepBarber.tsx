'use client'
// src/components/booking/StepBarber.tsx
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { barbersApi, unwrap } from '@/lib/api'
import { useBookingStore } from '@/store/booking.store'
import { Card, Avatar, StarRating, Badge, Button, Skeleton } from '@/components/ui'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import type { BarberProfile } from '@/types'

export function StepBarber() {
  const { selectedBarber, setBarber, setStep } = useBookingStore()

  const { data: barbers, isLoading } = useQuery({
    queryKey: ['barbers', 'available'],
    queryFn: () => barbersApi.getAll({ isAvailable: true }).then((r) => unwrap<BarberProfile[]>(r)),
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">Chọn thợ cắt tóc</h2>
        <p className="text-sm text-neutral-500 mt-1">Chọn thợ bạn muốn đặt lịch</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex gap-3 mb-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {barbers?.map((barber, i) => {
            const isSelected = selectedBarber?.id === barber.id
            return (
              <motion.div key={barber.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <button onClick={() => setBarber(barber)} className="w-full text-left">
                  <Card className={`p-5 transition-all duration-200 hover:shadow-md ${
                    isSelected ? 'ring-2 ring-neutral-900 shadow-md' : 'hover:border-neutral-200'
                  }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative">
                        <Avatar name={barber.user?.name ?? 'B'} src={barber.avatarUrl ?? barber.user?.avatarUrl} size="lg" />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-neutral-900 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm">{barber.user?.name}</p>
                        <p className="text-xs text-neutral-500">{barber.experience} năm kinh nghiệm</p>
                        <StarRating rating={barber.rating} />
                      </div>
                    </div>
                    {barber.bio && (
                      <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{barber.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {barber.specialties.slice(0, 3).map((s) => (
                        <Badge key={s} className="text-[11px] bg-neutral-50 text-neutral-600 border-neutral-200">{s}</Badge>
                      ))}
                    </div>
                  </Card>
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          disabled={!selectedBarber}
          onClick={() => setStep('service')}
          icon={<ArrowRight className="w-4 h-4" />}
          size="lg"
        >
          Tiếp theo
        </Button>
      </div>
    </div>
  )
}
