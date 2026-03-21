'use client'
// src/app/dashboard/admin/users/page.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { usersApi, unwrap } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatCard } from '@/components/dashboard/BookingCard'
import { Button, Card, Avatar, Badge, EmptyState, Skeleton, Modal } from '@/components/ui'
import type { User, PaginatedResponse, Role } from '@/types'
import {
  Users, Search, ShieldCheck, ShieldOff,
  Scissors, UserCircle, Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

const ROLE_CONFIG: Record<Role, { label: string; color: string }> = {
  ADMIN:    { label: 'Admin',    color: 'bg-purple-50 text-purple-700 border-purple-200' },
  BARBER:   { label: 'Barber',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CUSTOMER: { label: 'Customer', color: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
}

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [roleFilter, setRole]   = useState<Role | 'ALL'>('ALL')
  const [page, setPage]         = useState(1)
  const [changeRole, setChangeRole] = useState<User | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: () =>
      usersApi.getAll({
        search: search || undefined,
        role:   roleFilter === 'ALL' ? undefined : roleFilter,
        page,
        limit: 15,
      }).then((r) => unwrap<PaginatedResponse<User>>(r)),
  })

  const toggleActive = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái tài khoản')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Lỗi cập nhật'),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => {
      toast.success('Đã cập nhật role')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setChangeRole(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Lỗi cập nhật role'),
  })

  const users      = data?.data ?? []
  const pagination = data?.pagination
  const totalPages = pagination?.totalPages ?? 1

  const admins    = users.filter((u) => u.role === 'ADMIN').length
  const barbers   = users.filter((u) => u.role === 'BARBER').length
  const customers = users.filter((u) => u.role === 'CUSTOMER').length

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Quản lý người dùng</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{pagination?.total ?? 0} tài khoản</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Admin"    value={admins}    icon={<Shield className="w-4 h-4" />} />
        <StatCard label="Barber"   value={barbers}   icon={<Scissors className="w-4 h-4" />} />
        <StatCard label="Customer" value={customers} icon={<Users className="w-4 h-4" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm theo tên, email, SĐT..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div className="flex gap-1.5">
          {(['ALL', 'ADMIN', 'BARBER', 'CUSTOMER'] as const).map((r) => (
            <button key={r}
              onClick={() => { setRole(r); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                roleFilter === r ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}>
              {r === 'ALL' ? 'Tất cả' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="Không tìm thấy người dùng" />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-100 bg-neutral-50">
                  <tr>
                    {['Người dùng', 'Role', 'SĐT', 'Ngày tạo', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {users.map((user, i) => (
                    <motion.tr key={user.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                            <p className="text-xs text-neutral-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${ROLE_CONFIG[user.role].color}`}>
                          {ROLE_CONFIG[user.role].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{user.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge className={user.isActive
                          ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                          : 'bg-red-50 text-red-600 border-red-200 text-xs'}>
                          {user.isActive ? 'Hoạt động' : 'Bị khoá'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm"
                            icon={<Shield className="w-3.5 h-3.5" />}
                            onClick={() => setChangeRole(user)}
                            className="text-neutral-500"
                          />
                          <Button
                            variant="ghost" size="sm"
                            icon={user.isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            className={user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                            loading={toggleActive.isPending}
                            onClick={() => toggleActive.mutate(user.id)}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Trước
              </Button>
              <span className="text-sm text-neutral-500">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      {/* Change role modal */}
      <Modal open={!!changeRole} onClose={() => setChangeRole(null)} title={`Đổi role: ${changeRole?.name}`}>
        <p className="text-sm text-neutral-600 mb-4">Chọn role mới cho tài khoản này.</p>
        <div className="space-y-2 mb-4">
          {(['CUSTOMER', 'BARBER', 'ADMIN'] as Role[]).map((r) => (
            <button key={r}
              onClick={() => changeRole && updateRole.mutate({ id: changeRole.id, role: r })}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                changeRole?.role === r
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              }`}>
              <span>{ROLE_CONFIG[r].label}</span>
              {changeRole?.role === r && <span className="text-xs text-neutral-500">Hiện tại</span>}
            </button>
          ))}
        </div>
        <Button variant="outline" className="w-full" onClick={() => setChangeRole(null)}>Huỷ</Button>
      </Modal>
    </DashboardLayout>
  )
}
