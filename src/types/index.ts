// src/types/index.ts

export type Role = 'CUSTOMER' | 'BARBER' | 'ADMIN'

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY'
  | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatarUrl?: string
  role: Role
  isActive: boolean
  createdAt: string
  barberProfile?: BarberProfile
}

// ── Barber ────────────────────────────────────────────────────
export interface BarberProfile {
  id: string
  userId: string
  bio?: string
  specialties: string[]
  experience: number
  avatarUrl?: string
  isAvailable: boolean
  rating: number
  totalReviews: number
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'avatarUrl'>
  schedules?: BarberSchedule[]
  reviews?: any
}

export interface BarberSchedule {
  id: string
  barberId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  isWorking: boolean
  slotDuration: number
}

export interface TimeSlot {
  start: string
  end: string
}

export interface AvailableSlotsResponse {
  date: string
  barberId: string
  slotDuration: number
  totalSlots: number
  availableSlots: number
  slots: TimeSlot[]
  message?: string
}

// ── Service ───────────────────────────────────────────────────
export interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  imageUrl?: string
  isActive: boolean
  category: string
}

// ── Booking ───────────────────────────────────────────────────
export interface BookingService {
  id: string
  serviceId: string
  price: number
  duration: number
  service: Pick<Service, 'name' | 'price'>
}

export interface Booking {
  id: string
  customerId: string
  barberId: string
  bookingDate: string
  startTime: string
  endTime: string
  status: BookingStatus
  totalPrice: number
  totalDuration: number
  notes?: string
  cancelReason?: string
  createdAt: string
  customer?: Pick<User, 'id' | 'name' | 'phone' | 'avatarUrl'>
  barber?: BarberProfile & { user: Pick<User, 'name' | 'phone' | 'avatarUrl'> }
  services: BookingService[]
  review?: Review
}

export interface Review {
  id: string
  bookingId: string
  barberId: string
  rating: number
  comment?: string
  createdAt: string
}

// ── Pagination ────────────────────────────────────────────────
export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}

// ── API Response ──────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ── Dashboard ─────────────────────────────────────────────────
export interface DashboardStats {
  overview: {
    bookingsToday: number
    bookingsThisMonth: number
    bookingsLastMonth: number
    revenueThisMonth: number
    revenueLastMonth: number
    revenueGrowth: number
  }
  bookingsByStatus: Record<BookingStatus, number>
  topBarbers: BarberProfile[]
  topServices: { serviceId: string; name: string; count: number }[]
  recentBookings: Booking[]
}

// ── Auth ──────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}
