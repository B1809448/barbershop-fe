'use client'
// src/app/dashboard/customer/profile/page.tsx
import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usersApi, authApi, unwrap } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Card, Input, Avatar, Modal } from '@/components/ui'
import type { User } from '@/types'
import { Save, Lock, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'

const profileSchema = z.object({
  name:  z.string().min(2, 'Tên ít nhất 2 ký tự'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Bắt buộc'),
  newPassword:     z.string().min(6, 'Ít nhất 6 ký tự'),
  confirm:         z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Mật khẩu không khớp', path: ['confirm'],
})

type ProfileForm  = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function CustomerProfilePage() {
  const { user, setUser } = useAuthStore()
  const [pwModal, setPwModal] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) })

  const {
    register: regPw,
    handleSubmit: handlePw,
    reset: resetPw,
    formState: { errors: pwErrors, isSubmitting: pwSaving },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    if (user) reset({ name: user.name, phone: user.phone ?? '' })
  }, [user, reset])

  const saveProfile = async (d: ProfileForm) => {
    try {
      const res = await usersApi.updateProfile(d)
      const updated = unwrap<User>(res)
      setUser({ ...user!, ...updated })
      toast.success('Đã cập nhật thông tin')
    } catch {
      toast.error('Lỗi cập nhật')
    }
  }

  const changePassword = async (d: PasswordForm) => {
    try {
      await authApi.changePassword({
        currentPassword: d.currentPassword,
        newPassword:     d.newPassword,
      })
      toast.success('Đổi mật khẩu thành công!')
      resetPw()
      setPwModal(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Mật khẩu hiện tại không đúng')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Hồ sơ cá nhân</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="max-w-md space-y-5">
        {/* Avatar */}
        <Card className="p-5 flex items-center gap-4">
          <Avatar name={user?.name ?? 'U'} src={user?.avatarUrl} size="xl" />
          <div>
            <p className="font-semibold text-neutral-900">{user?.name}</p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Thành viên từ tháng {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi', { month: 'long', year: 'numeric' }) : '—'}</p>
          </div>
        </Card>

        {/* Profile form */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Thông tin cá nhân
            </h2>
            <form onSubmit={handleSubmit(saveProfile)} className="space-y-4">
              <Input
                label="Họ và tên"
                error={errors.name?.message}
                {...register('name')}
              />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                <input
                  value={user?.email ?? ''}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-400 mt-1">Email không thể thay đổi</p>
              </div>
              <Input
                label="Số điện thoại"
                placeholder="0901234567"
                {...register('phone')}
              />
              <Button type="submit" loading={isSubmitting} icon={<Save className="w-4 h-4" />}>
                Lưu thay đổi
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Bảo mật
            </h2>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-neutral-900">Mật khẩu</p>
                <p className="text-xs text-neutral-500 mt-0.5">Cập nhật mật khẩu để bảo vệ tài khoản</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPwModal(true)}>Đổi mật khẩu</Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Change password modal */}
      <Modal open={pwModal} onClose={() => { setPwModal(false); resetPw() }} title="Đổi mật khẩu">
        <form onSubmit={handlePw(changePassword)} className="space-y-4">
          <Input
            label="Mật khẩu hiện tại"
            type="password" placeholder="••••••••"
            error={pwErrors.currentPassword?.message}
            {...regPw('currentPassword')}
          />
          <Input
            label="Mật khẩu mới"
            type="password" placeholder="••••••••"
            error={pwErrors.newPassword?.message}
            {...regPw('newPassword')}
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password" placeholder="••••••••"
            error={pwErrors.confirm?.message}
            {...regPw('confirm')}
          />
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" type="button" onClick={() => { setPwModal(false); resetPw() }}>Huỷ</Button>
            <Button className="flex-1" type="submit" loading={pwSaving}>Đổi mật khẩu</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
