'use client'
// src/app/dashboard/admin/barbers/page.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { barbersApi, usersApi, unwrap } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, Avatar, StarRating, Badge, Button, Modal, Input, EmptyState, Skeleton } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { BarberProfile, User, PaginatedResponse } from '@/types'
import {
  Search, Plus, Pencil, ToggleLeft, ToggleRight,
  Scissors, Star, CalendarDays, TrendingUp, ExternalLink,
  CheckCircle2, XCircle, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const editSchema = z.object({
  bio:         z.string().optional(),
  experience:  z.coerce.number().min(0).optional(),
  specialties: z.string().optional(), // comma-separated
  isAvailable: z.boolean().optional(),
})
type EditForm = z.infer<typeof editSchema>

export default function AdminBarbersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editBarber, setEditBarber] = useState<BarberProfile | null>(null)
  const [statsBarber, setStatsBarber] = useState<BarberProfile | null>(null)

  const { data: barbers, isLoading } = useQuery({
    queryKey: ['admin-barbers'],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: () => barbersApi.getAll({}).then((r) => unwrap<BarberProfile[]>(r)),
  })

  const { data: statsData } = useQuery({
    queryKey: ['barber-stats-admin', statsBarber?.id],
    queryFn: () =>
      statsBarber
        ? barbersApi.getMyStats().then((r) => unwrap<any>(r))
        : Promise.resolve(null),
    enabled: !!statsBarber,
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  })

  const updateMut = useMutation({
    mutationFn: (data: EditForm & { id: string }) => {
      const payload: any = { ...data }
      if (typeof data.specialties === 'string') {
        payload.specialties = data.specialties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
      return barbersApi.updateMyProfile(payload)
    },
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin thợ')
      qc.invalidateQueries({ queryKey: ['admin-barbers'] })
      setEditBarber(null)
    },
    onError: () => toast.error('Lỗi cập nhật'),
  })

  const toggleAvailMut = useMutation({
    mutationFn: ({ barber }: { barber: BarberProfile }) =>
      barbersApi.updateMyProfile({ isAvailable: !barber.isAvailable }),
    onSuccess: (_, { barber }) => {
      toast.success(barber.isAvailable ? 'Đã tắt nhận lịch' : 'Đã bật nhận lịch')
      qc.invalidateQueries({ queryKey: ['admin-barbers'] })
    },
  })

  const onOpenEdit = (barber: BarberProfile) => {
    setEditBarber(barber)
    reset({
      bio:         barber.bio ?? '',
      experience:  barber.experience,
      specialties: barber.specialties.join(', '),
      isAvailable: barber.isAvailable,
    })
  }

  const filtered = barbers?.filter((b) => {
    const q = search.toLowerCase()
    return (
      !q ||
      b.user?.name?.toLowerCase().includes(q) ||
      b.user?.email?.toLowerCase().includes(q) ||
      b.specialties.some((s) => s.toLowerCase().includes(q))
    )
  }) ?? []

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Quản lý thợ cắt tóc</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{barbers?.length ?? 0} thợ</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm thợ..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 w-48"
            />
          </div>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng thợ',       value: barbers?.length ?? 0,                            icon: <Scissors className="w-4 h-4" /> },
          { label: 'Đang nhận lịch', value: barbers?.filter((b) => b.isAvailable).length ?? 0, icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: 'Đánh giá TB',    value: barbers?.length
              ? (barbers.reduce((s, b) => s + b.rating, 0) / barbers.length).toFixed(1) + '★'
              : '—',                                                                           icon: <Star className="w-4 h-4" /> },
          { label: 'Tổng reviews',   value: barbers?.reduce((s, b) => s + b.totalReviews, 0) ?? 0, icon: <CalendarDays className="w-4 h-4" /> },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-neutral-500">{item.label}</p>
              <div className="w-7 h-7 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">
                {item.icon}
              </div>
            </div>
            <p className="text-xl font-bold text-neutral-900">{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Barbers table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Scissors className="w-10 h-10" />}
          title="Không có thợ nào"
          description="Thêm thợ bằng cách đổi role user thành BARBER"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((barber, i) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar
                        name={barber.user?.name ?? 'B'}
                        src={barber.avatarUrl ?? barber.user?.avatarUrl}
                        size="md"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        barber.isAvailable ? 'bg-green-500' : 'bg-neutral-300'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-neutral-900 text-sm">{barber.user?.name}</p>
                        <Badge className={`text-[10px] ${
                          barber.isAvailable
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}>
                          {barber.isAvailable ? 'Nhận lịch' : 'Không nhận'}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-500 truncate">{barber.user?.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <StarRating rating={barber.rating} />
                        <span className="text-xs text-neutral-400">{barber.totalReviews} reviews</span>
                        <span className="text-xs text-neutral-400">{barber.experience} năm KN</span>
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px]">
                    {barber.specialties.slice(0, 3).map((s) => (
                      <Badge key={s} className="bg-neutral-100 text-neutral-600 border-neutral-200 text-[10px]">{s}</Badge>
                    ))}
                    {barber.specialties.length > 3 && (
                      <Badge className="bg-neutral-100 text-neutral-500 border-neutral-200 text-[10px]">+{barber.specialties.length - 3}</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={`/barbers/${barber.id}`} target="_blank">
                      <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />} />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={barber.isAvailable
                        ? <ToggleRight className="w-4 h-4 text-green-600" />
                        : <ToggleLeft className="w-4 h-4 text-neutral-400" />
                      }
                      onClick={() => toggleAvailMut.mutate({ barber })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Pencil className="w-3.5 h-3.5" />}
                      onClick={() => onOpenEdit(barber)}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      <Modal open={!!editBarber} onClose={() => setEditBarber(null)} title="Chỉnh sửa thông tin thợ">
        {editBarber && (
          <form
            onSubmit={handleSubmit((data) =>
              updateMut.mutate({ ...data, id: editBarber.id })
            )}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl mb-2">
              <Avatar name={editBarber.user?.name ?? 'B'} src={editBarber.user?.avatarUrl} size="sm" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{editBarber.user?.name}</p>
                <p className="text-xs text-neutral-500">{editBarber.user?.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Giới thiệu (bio)</label>
              <textarea
                {...register('bio')}
                rows={3}
                placeholder="Mô tả ngắn về thợ..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
              />
            </div>

            <Input
              label="Năm kinh nghiệm"
              type="number"
              {...register('experience')}
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Chuyên môn <span className="text-neutral-400 font-normal">(cách nhau bằng dấu phẩy)</span>
              </label>
              <input
                {...register('specialties')}
                placeholder="fade, undercut, beard trim"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...register('isAvailable')} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-neutral-700">Đang nhận lịch</span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" type="button" onClick={() => setEditBarber(null)}>
                Huỷ
              </Button>
              <Button className="flex-1" type="submit" loading={isSubmitting}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  )
}
