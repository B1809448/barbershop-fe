'use client'
// src/components/ui/index.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

// ── Button ────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2'
    const variants = {
      primary:   'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98]',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:scale-[0.98]',
      ghost:     'text-neutral-700 hover:bg-neutral-100 active:scale-[0.98]',
      danger:    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
      outline:   'border border-neutral-200 text-neutral-800 hover:bg-neutral-50 active:scale-[0.98]',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    }
    return (
      <button ref={ref} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ── Input ─────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-neutral-900 placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent',
          'transition-shadow duration-150',
          error ? 'border-red-300 focus:ring-red-500' : 'border-neutral-200',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, className, ...props }: { children: ReactNode; className?: string; [k: string]: any }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-neutral-100 shadow-card', className)} {...props}>
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border', className)}>
      {children}
    </span>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-neutral-100', className)} />
}

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return src
    ? <img src={src} alt={name} className={cn('rounded-full object-cover flex-shrink-0', sizes[size])} />
    : <div className={cn('rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold flex-shrink-0', sizes[size])}>{initials}</div>
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, children, title }: {
  open: boolean; onClose: () => void; children: ReactNode; title?: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-neutral-300">{icon}</div>}
      <h3 className="text-sm font-semibold text-neutral-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-neutral-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Star Rating ───────────────────────────────────────────────
export function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} className={cn('w-4 h-4', i < Math.round(rating) ? 'text-amber-400' : 'text-neutral-200')} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-neutral-500">{rating.toFixed(1)}</span>
    </div>
  )
}
