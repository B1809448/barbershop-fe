'use client'
// src/app/dashboard/admin/services/page.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { servicesApi, unwrap } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Card, Badge, Modal, Input, EmptyState } from '@/components/ui'
import { formatCurrency, formatDuration } from '@/lib/utils'
import type { Service } from '@/types'
import { Plus, Pencil, EyeOff, Scissors } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name:        z.string().min(1, 'Bắt buộc'),
  description: z.string().optional(),
  price:       z.coerce.number().min(0),
  duration:    z.coerce.number().min(5),
  category:    z.string().default('haircut'),
})
type FormData = z.infer<typeof schema>

export default function AdminServicesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Service | null>(null)

  const { data: services } = useQuery({
    queryKey: ['services-admin'],
    queryFn: () => servicesApi.getAllAdmin({}).then((r) => unwrap<Service[]>(r)),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const openCreate = () => { reset({}); setEditing(null); setModal('create') }
  const openEdit   = (svc: Service) => { reset(svc); setEditing(svc); setModal('edit') }

  const createMut = useMutation({
    mutationFn: (d: FormData) => servicesApi.create(d),
    onSuccess: () => { toast.success('Đã tạo dịch vụ'); qc.invalidateQueries({ queryKey: ['services-admin'] }); setModal(null) },
    onError: () => toast.error('Lỗi tạo dịch vụ'),
  })

  const updateMut = useMutation({
    mutationFn: (d: FormData) => servicesApi.update(editing!.id, d),
    onSuccess: () => { toast.success('Đã cập nhật'); qc.invalidateQueries({ queryKey: ['services-admin'] }); setModal(null) },
    onError: () => toast.error('Lỗi cập nhật'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => { toast.success('Đã ẩn dịch vụ'); qc.invalidateQueries({ queryKey: ['services-admin'] }) },
  })

  const onSubmit = (d: FormData) => modal === 'create' ? createMut.mutate(d) : updateMut.mutate(d)

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Quản lý dịch vụ</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{services?.length ?? 0} dịch vụ</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>Thêm dịch vụ</Button>
      </div>

      <div className="space-y-3">
        {services?.map((svc, i) => (
          <motion.div key={svc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={`p-4 flex items-center gap-4 ${!svc.isActive ? 'opacity-50' : ''}`}>
              <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4 text-neutral-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-neutral-900 text-sm">{svc.name}</p>
                  <Badge className="text-[10px] bg-neutral-100 text-neutral-600 border-neutral-200">{svc.category}</Badge>
                  {!svc.isActive && <Badge className="text-[10px] bg-red-50 text-red-600 border-red-200">Ẩn</Badge>}
                </div>
                {svc.description && <p className="text-xs text-neutral-500 mt-0.5 truncate">{svc.description}</p>}
                <p className="text-xs text-neutral-400 mt-0.5">{formatDuration(svc.duration)}</p>
              </div>
              <p className="font-semibold text-neutral-900 text-sm shrink-0">{formatCurrency(svc.price)}</p>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(svc)} />
                {svc.isActive && (
                  <Button variant="ghost" size="sm" icon={<EyeOff className="w-3.5 h-3.5" />}
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => deleteMut.mutate(svc.id)} />
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Thêm dịch vụ' : 'Sửa dịch vụ'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Tên dịch vụ" placeholder="Cắt tóc nam" error={errors.name?.message} {...register('name')} />
          <Input label="Mô tả" placeholder="Mô tả ngắn..." {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Giá (VNĐ)" type="number" placeholder="80000" error={errors.price?.message} {...register('price')} />
            <Input label="Thời gian (phút)" type="number" placeholder="30" error={errors.duration?.message} {...register('duration')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Danh mục</label>
            <select {...register('category')}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white">
              {['haircut','beard','color','combo','other'].map((c) => (
                <option key={c} value={c}>{{ haircut:'Cắt tóc', beard:'Râu', color:'Nhuộm', combo:'Combo', other:'Khác' }[c]}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
            {modal === 'create' ? 'Tạo dịch vụ' : 'Lưu thay đổi'}
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
