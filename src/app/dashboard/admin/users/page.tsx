'use client'
// src/app/dashboard/admin/users/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { usersApi } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Card, Avatar, Badge, EmptyState, Skeleton, Modal } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import {
  Users, Search, ShieldCheck, ShieldOff, Shield,
  Scissors, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
type Role = 'ADMIN' | 'BARBER' | 'CUSTOMER'

interface UserItem {
  id: string
  email: string
  name: string
  phone?: string | null
  avatarUrl?: string | null
  role: Role
  isActive: boolean
  createdAt: string
}

// ── Constants ─────────────────────────────────────────────────
const ROLE_STYLE: Record<Role, string> = {
  ADMIN:    'bg-purple-50 text-purple-700 border-purple-200',
  BARBER:   'bg-blue-50 text-blue-700 border-blue-200',
  CUSTOMER: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}
const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin', BARBER: 'Barber', CUSTOMER: 'Customer',
}

// ── Component ─────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [searchInput, setSearchInput]   = useState('')
  const [search, setSearch]             = useState('')       // debounced
  const [roleFilter, setRoleFilter]     = useState<Role | 'ALL'>('ALL')
  const [page, setPage]                 = useState(1)
  const [changeRoleUser, setChangeRoleUser] = useState<UserItem | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  // ── Query ─────────────────────────────────────────────────
  const { data: rawData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 15 }
      if (search)              params.search = search
      if (roleFilter !== 'ALL') params.role  = roleFilter

      const res = await usersApi.getAll(params)

      // res.data = { success: true, data: { data: [...], pagination: {...} } }
      // Lấy phần bên trong data wrapper của backend
      const body = res.data           // { success, data: { data, pagination } }
      return {
        users:      (body?.data      ?? []) as UserItem[],
        pagination: body?.pagination ?? null,
      }
    },
    placeholderData: (prev) => prev,   // giữ data cũ khi đang fetch tránh flash
    staleTime: 10_000,
  })

  const users      = rawData?.users      ?? []
  const pagination = rawData?.pagination

  // ── Mutations ──────────────────────────────────────────────
  const toggleActive = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Lỗi cập nhật'),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => {
      toast.success('Đã đổi role thành công')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setChangeRoleUser(null)
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Lỗi đổi role'),
  })

  // ── Render ─────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Quản lý người dùng</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {pagination ? `${pagination.total} tài khoản` : '\u00a0'}
          </p>
        </div>
        {isFetching && !isLoading && (
          <span className="text-xs text-neutral-400 animate-pulse">Đang cập nhật...</span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng',     value: pagination?.total ?? '—', icon: <Users className="w-4 h-4" /> },
          { label: 'Barber',   value: users.filter(u => u.role === 'BARBER').length,   icon: <Scissors className="w-4 h-4" /> },
          { label: 'Customer', value: users.filter(u => u.role === 'CUSTOMER').length, icon: <Users className="w-4 h-4" /> },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-neutral-500">{s.label}</p>
              <div className="w-7 h-7 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">
                {s.icon}
              </div>
            </div>
            <p className="text-xl font-bold text-neutral-900">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['ALL', 'ADMIN', 'BARBER', 'CUSTOMER'] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                roleFilter === r
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {r === 'ALL' ? 'Tất cả' : ROLE_LABEL[r as Role]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && users.length === 0 && (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Không tìm thấy người dùng"
          description="Thử thay đổi từ khoá hoặc bộ lọc"
        />
      )}

      {/* Table */}
      {!isLoading && users.length > 0 && (
        <>
          <Card className="overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="border-b border-neutral-100 bg-neutral-50">
                  <tr>
                    {['Người dùng', 'Role', 'SĐT', 'Ngày tạo', 'Trạng thái', ''].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {users.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      {/* Avatar + name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={user.name}
                            src={user.avatarUrl ?? undefined}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">{user.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${ROLE_STYLE[user.role]}`}>
                          {ROLE_LABEL[user.role]}
                        </Badge>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {user.phone ?? '—'}
                      </td>

                      {/* Created at */}
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {format(parseISO(user.createdAt), 'dd/MM/yyyy')}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge className={user.isActive
                          ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                          : 'bg-red-50 text-red-600 border-red-200 text-xs'
                        }>
                          {user.isActive ? 'Hoạt động' : 'Bị khoá'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="sm"
                            icon={<Shield className="w-3.5 h-3.5" />}
                            onClick={() => setChangeRoleUser(user)}
                            className="text-neutral-500 hover:bg-neutral-100"
                          />
                          <Button
                            variant="ghost" size="sm"
                            icon={user.isActive
                              ? <ShieldOff className="w-3.5 h-3.5" />
                              : <ShieldCheck className="w-3.5 h-3.5" />
                            }
                            className={user.isActive
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                            }
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
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline" size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-neutral-500 px-2">
                {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Change Role Modal */}
      <Modal
        open={!!changeRoleUser}
        onClose={() => setChangeRoleUser(null)}
        title={`Đổi role: ${changeRoleUser?.name ?? ''}`}
      >
        {changeRoleUser && (
          <div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl mb-4">
              <Avatar name={changeRoleUser.name} src={changeRoleUser.avatarUrl ?? undefined} size="sm" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{changeRoleUser.name}</p>
                <p className="text-xs text-neutral-500">{changeRoleUser.email}</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-3">Chọn role mới:</p>
            <div className="space-y-2 mb-4">
              {(['CUSTOMER', 'BARBER', 'ADMIN'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    if (changeRoleUser.role === r) return
                    updateRole.mutate({ id: changeRoleUser.id, role: r })
                  }}
                  disabled={updateRole.isPending}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
                    changeRoleUser.role === r
                      ? 'border-neutral-900 bg-neutral-50 cursor-default'
                      : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 cursor-pointer'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Badge className={`text-xs ${ROLE_STYLE[r]}`}>{ROLE_LABEL[r]}</Badge>
                  </span>
                  {changeRoleUser.role === r && (
                    <span className="text-xs text-neutral-400">Hiện tại</span>
                  )}
                </button>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setChangeRoleUser(null)}>
              Đóng
            </Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
