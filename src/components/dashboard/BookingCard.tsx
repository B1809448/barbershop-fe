'use client'
// src/components/dashboard/BookingCard.tsx
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { Badge, Avatar, Card, StarRating } from '@/components/ui'
import { formatCurrency, formatDuration, STATUS_CONFIG } from '@/lib/utils'
import { Clock, Calendar, Scissors } from 'lucide-react'
import type { Booking } from '@/types'
import type { ReactNode } from 'react'

export function StatusBadge({ status }: { status: Booking['status'] }) {
  const cfg = STATUS_CONFIG[status]
  return <Badge className={`${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
}

export function BookingCard({ booking, actions }: { booking: Booking; actions?: ReactNode }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {booking.barber && (
            <Avatar
              name={booking.barber.user?.name ?? 'B'}
              src={booking.barber.user?.avatarUrl}
              size="md"
            />
          )}
          {booking.customer && (
            <Avatar
              name={booking.customer.name}
              src={booking.customer.avatarUrl}
              size="md"
            />
          )}
          <div>
            <p className="font-semibold text-neutral-900 text-sm">
              {booking.barber?.user?.name ?? booking.customer?.name}
            </p>
            <p className="text-xs text-neutral-500">
              {booking.services.map((s) => s.service.name).join(', ')}
            </p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {format(parseISO(booking.bookingDate), 'dd/MM/yyyy')}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {booking.startTime} – {booking.endTime}
        </span>
        <span className="flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5" />
          {formatDuration(booking.totalDuration)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-bold text-neutral-900 text-sm">{formatCurrency(booking.totalPrice)}</p>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {booking.notes && (
        <p className="mt-2 text-xs text-neutral-500 italic">"{booking.notes}"</p>
      )}
    </Card>
  )
}

export function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        {icon && <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </Card>
  )
}
