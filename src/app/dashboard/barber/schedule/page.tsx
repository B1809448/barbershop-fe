'use client'
// src/app/dashboard/barber/schedule/page.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { schedulesApi, unwrap } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Card } from '@/components/ui'
import { DAY_LABELS } from '@/lib/utils'
import type { BarberSchedule, DayOfWeek } from '@/types'
import { Clock, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

const ALL_DAYS: DayOfWeek[] = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']

interface ScheduleForm {
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  isWorking: boolean
  slotDuration: number
}

export default function BarberSchedulePage() {
  const qc = useQueryClient()
  const [schedules, setSchedules] = useState<ScheduleForm[]>(
    ALL_DAYS.map((d) => ({ dayOfWeek: d, startTime: '08:00', endTime: '18:00', isWorking: d !== 'SUNDAY', slotDuration: 30 }))
  )

  const { data: existing } = useQuery({
    queryKey: ['my-schedules'],
    queryFn: () => schedulesApi.getMySchedules().then((r) => unwrap<BarberSchedule[]>(r)),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  useEffect(() => {
    if (!existing) return
    setSchedules((prev) => prev.map((s) => {
      const found = existing.find((e) => e.dayOfWeek === s.dayOfWeek)
      return found ? { ...s, startTime: found.startTime, endTime: found.endTime, isWorking: found.isWorking, slotDuration: found.slotDuration } : s
    }))
  }, [existing])

  const save = useMutation({
    mutationFn: () => schedulesApi.bulkUpsert(schedules),
    onSuccess: () => {
      toast.success('Đã lưu lịch làm việc')
      qc.invalidateQueries({ queryKey: ['my-schedules'] })
    },
    onError: () => toast.error('Lỗi khi lưu lịch'),
  })

  const update = (day: DayOfWeek, field: keyof ScheduleForm, value: any) =>
    setSchedules((prev) => prev.map((s) => s.dayOfWeek === day ? { ...s, [field]: value } : s))

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Lịch làm việc</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Cấu hình giờ làm việc theo từng ngày</p>
        </div>
        <Button onClick={() => save.mutate()} loading={save.isPending} icon={<Save className="w-4 h-4" />}>
          Lưu lịch
        </Button>
      </div>

      <div className="space-y-3">
        {schedules.map((sch, i) => (
          <motion.div key={sch.dayOfWeek} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={`p-4 transition-all ${sch.isWorking ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Toggle */}
                <label className="flex items-center gap-2 cursor-pointer min-w-[100px]">
                  <button
                    onClick={() => update(sch.dayOfWeek, 'isWorking', !sch.isWorking)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${sch.isWorking ? 'bg-neutral-900' : 'bg-neutral-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sch.isWorking ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className="text-sm font-semibold text-neutral-900 w-14">{DAY_LABELS[sch.dayOfWeek]}</span>
                </label>

                {sch.isWorking && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <input type="time" value={sch.startTime} onChange={(e) => update(sch.dayOfWeek, 'startTime', e.target.value)}
                        className="px-2.5 py-1.5 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900" />
                      <span className="text-neutral-400 text-sm">—</span>
                      <input type="time" value={sch.endTime} onChange={(e) => update(sch.dayOfWeek, 'endTime', e.target.value)}
                        className="px-2.5 py-1.5 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900" />
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs text-neutral-500">Slot:</span>
                      {[15, 30, 45, 60].map((min) => (
                        <button key={min} onClick={() => update(sch.dayOfWeek, 'slotDuration', min)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${sch.slotDuration === min ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                          {min}p
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {!sch.isWorking && (
                  <span className="text-sm text-neutral-400 italic">Nghỉ</span>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  )
}
