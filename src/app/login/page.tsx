'use client'
// src/app/login/page.tsx
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
  email:    z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data)
      const { user, accessToken, refreshToken } = unwrap<LoginResponse>(res)
      setAuth(user, accessToken, refreshToken)
      toast.success(`Chào mừng, ${user.name}!`)
      const redirect =
        user.role === 'ADMIN'  ? '/dashboard/admin'  :
        user.role === 'BARBER' ? '/dashboard/barber' :
                                 '/dashboard/customer'
      router.push(redirect)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đăng nhập thất bại')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
            <div className="w-9 h-9 bg-neutral-900 rounded-xl flex items-center justify-center">
              <Scissors className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-semibold text-neutral-900">PhuocDai BarberShop</span>
          </Link>

          <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-8">
            <h1 className="text-xl font-bold text-neutral-900 mb-1">Đăng nhập</h1>
            <p className="text-sm text-neutral-500 mb-6">Chào mừng bạn quay lại</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@example.com"
                error={errors.email?.message} {...register('email')} />
              <Input label="Mật khẩu" type="password" placeholder="••••••••"
                error={errors.password?.message} {...register('password')} />

              <Button type="submit" className="w-full mt-2" loading={isSubmitting} size="lg">
                Đăng nhập
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-medium text-neutral-900 hover:underline">Đăng ký</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
