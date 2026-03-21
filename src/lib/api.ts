// src/lib/api.ts
import axios, { AxiosError } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — auto refresh
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })
        const { accessToken, refreshToken: newRefresh } = res.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefresh)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register:       (data: any)                   => api.post('/auth/register', data),
  login:          (data: any)                   => api.post('/auth/login', data),
  logout:         ()                            => api.post('/auth/logout'),
  me:             ()                            => api.get('/auth/me'),
  changePassword: (data: any)                   => api.post('/auth/change-password', data),
}

// ── Services ──────────────────────────────────────────────────
export const servicesApi = {
  getAll:        (params?: any) => api.get('/services', { params }),
  getCategories: ()             => api.get('/services/categories'),
  getOne:        (id: string)   => api.get(`/services/${id}`),
  create:        (data: any)    => api.post('/services', data),
  update:        (id: string, data: any) => api.patch(`/services/${id}`, data),
  delete:        (id: string)   => api.delete(`/services/${id}`),
  getAllAdmin:    (params?: any) => api.get('/services/admin/all', { params }),
}

// ── Barbers ───────────────────────────────────────────────────
export const barbersApi = {
  getAll:          (params?: any) => api.get('/barbers', { params }),
  getOne:          (id: string)   => api.get(`/barbers/${id}`),
  getMyProfile:    ()             => api.get('/barbers/me/profile'),
  updateMyProfile: (data: any)    => api.patch('/barbers/me/profile', data),
  getMyBookings:   (params?: any) => api.get('/barbers/me/bookings', { params }),
  getMyStats:      ()             => api.get('/barbers/me/stats'),
  createReview:    (bookingId: string, data: any) => api.post(`/barbers/reviews/${bookingId}`, data),
}

// ── Schedules ─────────────────────────────────────────────────
export const schedulesApi = {
  getAvailableSlots: (barberId: string, params: any) =>
    api.get(`/schedules/barbers/${barberId}/available-slots`, { params }),
  getMySchedules:    ()           => api.get('/schedules/me'),
  upsertSchedule:    (data: any)  => api.patch('/schedules/me', data),
  bulkUpsert:        (data: any)  => api.patch('/schedules/me/bulk', data),
  getMyTimeOffs:     ()           => api.get('/schedules/me/time-offs'),
  createTimeOff:     (data: any)  => api.post('/schedules/me/time-offs', data),
  deleteTimeOff:     (id: string) => api.delete(`/schedules/me/time-offs/${id}`),
}

// ── Bookings ──────────────────────────────────────────────────
export const bookingsApi = {
  create:           (data: any)              => api.post('/bookings', data),
  getMyBookings:    (params?: any)           => api.get('/bookings/my', { params }),
  getOne:           (id: string)             => api.get(`/bookings/${id}`),
  cancel:           (id: string, reason?: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),
  updateStatusBarber: (id: string, data: any) =>
    api.patch(`/bookings/${id}/status/barber`, data),
  // Admin
  getAllAdmin:       (params?: any) => api.get('/bookings/admin', { params }),
  getDashboard:     ()             => api.get('/bookings/admin/dashboard'),
  updateStatusAdmin:(id: string, data: any) =>
    api.patch(`/bookings/${id}/status/admin`, data),
}

// ── Users ─────────────────────────────────────────────────────
export const usersApi = {
  getAll:        (params?: any)   => api.get('/users', { params }),
  getOne:        (id: string)     => api.get(`/users/${id}`),
  updateProfile: (data: any)      => api.patch('/users/me/profile', data),
  updateRole:    (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  toggleActive:  (id: string)     => api.patch(`/users/${id}/toggle-active`),
  getMyBookings: (params?: any)   => api.get('/users/me/bookings', { params }),
}

// Helper to extract data from ApiResponse
export function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data
}
