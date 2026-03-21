'use client'
// src/app/dashboard/barber/profile/page.tsx
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { barbersApi, authApi, unwrap } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Card, Input, Avatar } from '@/components/ui'
import type { BarberProfile, User } from '@/types'
import { Save, User as UserIcon, BookOpen, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  bio:        z.string().optional(),
  experience: z.coerce.number().min(0).max(50),
  specialties: z.string().optional(),
  isAvailable: z.boolean(),
})

const accountSchema = z.object({
  name:  z.string().min(2, 'Tên ít nhất 2 ký tự'),
  phone: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>
type AccountForm = z.infer<typeof accountSchema>

export default function BarberProfilePage() {
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['my-barber-profile'],
    queryFn: () => barbersApi.getMyProfile().then((r) => unwrap<BarberProfile>(r)),
  })

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSaving },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) })

  const {
    register: regAccount,
    handleSubmit: handleAccount,
    reset: resetAccount,
    formState: { errors: accountErrors, isSubmitting: accountSaving },
  } = useForm<AccountForm>({ resolver: zodResolver(accountSchema) })

  // Populate forms when data loads
  useEffect(() => {
    if (profile) {
      resetProfile({
        bio:         profile.bio ?? '',
        experience:  profile.experience,
        specialties: profile.specialties.join(', '),
        isAvailable: profile.isAvailable,
      })
    }
  }, [profile, resetProfile])

  useEffect(() => {
    if (user) resetAccount({ name: user.name, phone: user.phone ?? '' })
  }, [user, resetAccount])

  const saveProfile = useMutation({
    mutationFn: (d: ProfileForm) =>
      barbersApi.updateMyProfile({
        bio:         d.bio,
        experience:  d.experience,
        isAvailable: d.isAvailable,
        specialties: d.specialties
          ? d.specialties.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật profile')
      qc.invalidateQueries({ queryKey: ['my-barber-profile'] })
    },
    onError: () => toast.error('Lỗi cập nhật profile'),
  })

  const saveAccount = async (d: AccountForm) => {
    try {
      const res = await (await import('@/lib/api')).usersApi.updateProfile(d)
      const updated = unwrap<User>(res)
      setUser({ ...user!, ...updated })
      toast.success('Đã cập nhật thông tin tài khoản')
    } catch {
      toast.error('Lỗi cập nhật tài khoản')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Hồ sơ của tôi</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Quản lý thông tin cá nhân và barber profile</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Avatar display */}
        <Card className="p-5 flex items-center gap-4">
          <Avatar name={user?.name ?? 'B'} src={profile?.avatarUrl ?? user?.avatarUrl} size="xl" />
          <div>
            <p className="font-semibold text-neutral-900">{user?.name}</p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            <p className="text-xs text-neutral-400 mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </Card>

        {/* Account info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Thông tin tài khoản
            </h2>
            <form onSubmit={handleAccount(saveAccount)} className="space-y-4">
              <Input label="Họ và tên" error={accountErrors.name?.message} {...regAccount('name')} />
              <Input label="Số điện thoại" placeholder="0901234567" {...regAccount('phone')} />
              <Button type="submit" loading={accountSaving} icon={<Save className="w-4 h-4" />}>
                Lưu tài khoản
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Barber profile */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Barber profile
            </h2>
            <form onSubmit={handleProfile((d) => saveProfile.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Giới thiệu bản thân</label>
                <textarea rows={4} {...regProfile('bio')}
                  placeholder="Mô tả về bản thân, phong cách, kinh nghiệm..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                />
              </div>

              <Input
                label="Năm kinh nghiệm"
                type="number" min={0} max={50}
                error={profileErrors.experience?.message}
                {...regProfile('experience')}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Chuyên môn (cách nhau dấu phẩy)
                </label>
                <input
                  {...regProfile('specialties')}
                  placeholder="fade, undercut, beard trim, color"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <p className="text-xs text-neutral-400 mt-1">Ví dụ: fade, undercut, beard trim</p>
              </div>

              {/* Availability toggle */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-neutral-900">Nhận lịch đặt</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Tắt để tạm ngừng nhận booking mới</p>
                </div>
                <label className="relative cursor-pointer">
                  <input type="checkbox" className="sr-only peer" {...regProfile('isAvailable')} />
                  <div className="w-11 h-6 bg-neutral-200 peer-checked:bg-neutral-900 rounded-full transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              <Button type="submit" loading={saveProfile.isPending} icon={<Save className="w-4 h-4" />}>
                Lưu barber profile
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
