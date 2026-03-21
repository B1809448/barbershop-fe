'use client'
// src/app/booking/page.tsx
import { Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { useBookingStore, type BookingStep } from '@/store/booking.store'
import { StepBarber }   from '@/components/booking/StepBarber'
import { StepService }  from '@/components/booking/StepService'
import { StepDatetime } from '@/components/booking/StepDatetime'
import { StepConfirm }  from '@/components/booking/StepConfirm'
import { CheckCircle2 } from 'lucide-react'

const STEPS: { id: BookingStep; label: string }[] = [
  { id: 'barber',   label: 'Chọn thợ' },
  { id: 'service',  label: 'Dịch vụ' },
  { id: 'datetime', label: 'Ngày & giờ' },
  { id: 'confirm',  label: 'Xác nhận' },
]

export default function BookingPage() {
  const { step } = useBookingStore()
  const currentIdx = STEPS.findIndex((s) => s.id === step)

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const done    = i < currentIdx
              const current = i === currentIdx
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-300 ${
                      done    ? 'bg-neutral-900 text-white' :
                      current ? 'bg-neutral-900 text-white ring-4 ring-neutral-200' :
                                'bg-neutral-100 text-neutral-400'
                    }`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${current ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {s.label}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 h-px mx-3 transition-colors duration-300" style={{ background: i < currentIdx ? '#171717' : '#e5e5e5' }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Suspense fallback={<div className="h-64 bg-white rounded-2xl animate-pulse" />}>
              {step === 'barber'   && <StepBarber />}
              {step === 'service'  && <StepService />}
              {step === 'datetime' && <StepDatetime />}
              {step === 'confirm'  && <StepConfirm />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
