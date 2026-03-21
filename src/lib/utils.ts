// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { BookingStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND',
  }).format(amount)
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: vi })
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'HH:mm - dd/MM/yyyy')
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`
}

export const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  PENDING:     { label: 'Chờ xác nhận', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  CONFIRMED:   { label: 'Đã xác nhận',  color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  IN_PROGRESS: { label: 'Đang thực hiện',color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  COMPLETED:   { label: 'Hoàn thành',   color: 'text-green-700',   bg: 'bg-green-50 border-green-200' },
  CANCELLED:   { label: 'Đã huỷ',       color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
  NO_SHOW:     { label: 'Không đến',    color: 'text-neutral-600', bg: 'bg-neutral-100 border-neutral-200' },
}

export const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Thứ 2', TUESDAY: 'Thứ 3', WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5', FRIDAY: 'Thứ 6', SATURDAY: 'Thứ 7', SUNDAY: 'CN',
}
