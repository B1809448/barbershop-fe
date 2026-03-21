'use client'
// src/components/booking/StepService.tsx
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { servicesApi, unwrap } from '@/lib/api'
import { useBookingStore } from '@/store/booking.store'
import { Card, Badge, Button, Skeleton } from '@/components/ui'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { CheckCircle2, ArrowRight, ArrowLeft, Scissors, Clock } from 'lucide-react'
import type { Service } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  haircut: 'Cắt tóc', beard: 'Râu', color: 'Nhuộm', combo: 'Combo', other: 'Khác',
}

export function StepService() {
  const { selectedServices, toggleService, setStep, getTotalPrice, getTotalDuration } = useBookingStore()

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => servicesApi.getAll().then((r) => unwrap<Service[]>(r)),
  })

  const grouped = services?.reduce<Record<string, Service[]>>((acc, svc) => {
    const cat = svc.category || 'other'
    acc[cat] = [...(acc[cat] || []), svc]
    return acc
  }, {}) ?? {}

  const totalPrice    = getTotalPrice()
  const totalDuration = getTotalDuration()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">Chọn dịch vụ</h2>
        <p className="text-sm text-neutral-500 mt-1">Bạn có thể chọn nhiều dịch vụ</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, svcs]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              <div className="space-y-2">
                {svcs.map((svc, i) => {
                  const selected = selectedServices.some((s) => s.id === svc.id)
                  return (
                    <motion.div key={svc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <button onClick={() => toggleService(svc)} className="w-full text-left">
                        <Card className={`p-4 transition-all duration-150 ${
                          selected ? 'ring-2 ring-neutral-900' : 'hover:border-neutral-300 hover:shadow-sm'
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              selected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
                            }`}>
                              {selected ? <CheckCircle2 className="w-4 h-4" /> : <Scissors className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-900 text-sm">{svc.name}</p>
                              {svc.description && (
                                <p className="text-xs text-neutral-500 truncate mt-0.5">{svc.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-neutral-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{formatDuration(svc.duration)}
                                </span>
                              </div>
                            </div>
                            <p className="font-semibold text-neutral-900 text-sm shrink-0">{formatCurrency(svc.price)}</p>
                          </div>
                        </Card>
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary bar */}
      {selectedServices.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">{selectedServices.length} dịch vụ · {formatDuration(totalDuration)}</span>
            <span className="font-bold text-neutral-900">{formatCurrency(totalPrice)}</span>
          </div>
        </motion.div>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => setStep('barber')} icon={<ArrowLeft className="w-4 h-4" />}>
          Quay lại
        </Button>
        <Button disabled={selectedServices.length === 0} onClick={() => setStep('datetime')} icon={<ArrowRight className="w-4 h-4" />} size="lg">
          Tiếp theo
        </Button>
      </div>
    </div>
  )
}
