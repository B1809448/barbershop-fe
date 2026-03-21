'use client'
// src/app/register/page.tsx
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi, unwrap } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Button, Input } from '@/components/ui'
import { Scissors } from 'lucide-react'
import toast from 'react-hot-toast'
import type { LoginResponse } from '@/types'

const schema = z.object({
  name:     z.string().min(2, 'Tên ít nhất 2 ký tự'),
  email:    z.string().email('Email không hợp lệ'),
  phone:    z.string().optional(),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Mật khẩu không khớp', path: ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const { confirm, ...payload } = data
      const res = await authApi.register(payload)
      const { user, accessToken, refreshToken } = unwrap<LoginResponse>(res)
      setAuth(user, accessToken, refreshToken)
      toast.success('Đăng ký thành công!')
      router.push('/dashboard/customer')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đăng ký thất bại')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
            <div className="w-9 h-9 bg-neutral-900 rounded-xl flex items-center justify-center">
              <Scissors className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-semibold text-neutral-900">PhuocDai BarberShop</span>
          </Link>

          <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-8">
            <h1 className="text-xl font-bold text-neutral-900 mb-1">Tạo tài khoản</h1>
            <p className="text-sm text-neutral-500 mb-6">Đăng ký để đặt lịch dễ dàng hơn</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Họ và tên" placeholder="Nguyễn Văn A"
                error={errors.name?.message} {...register('name')} />
              <Input label="Email" type="email" placeholder="you@example.com"
                error={errors.email?.message} {...register('email')} />
              <Input label="Số điện thoại (tuỳ chọn)" placeholder="0901234567"
                error={errors.phone?.message} {...register('phone')} />
              <Input label="Mật khẩu" type="password" placeholder="••••••••"
                error={errors.password?.message} {...register('password')} />
              <Input label="Xác nhận mật khẩu" type="password" placeholder="••••••••"
                error={errors.confirm?.message} {...register('confirm')} />

              <Button type="submit" className="w-full mt-2" loading={isSubmitting} size="lg">
                Tạo tài khoản
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-medium text-neutral-900 hover:underline">Đăng nhập</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
