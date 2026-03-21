// src/store/booking.store.ts
import { create } from 'zustand'
import type { BarberProfile, Service, TimeSlot } from '@/types'

export type BookingStep = 'barber' | 'service' | 'datetime' | 'confirm'

interface BookingState {
  step: BookingStep
  selectedBarber: BarberProfile | null
  selectedServices: Service[]
  selectedDate: string | null
  selectedSlot: TimeSlot | null
  notes: string

  setStep:             (step: BookingStep) => void
  setBarber:           (barber: BarberProfile) => void
  toggleService:       (service: Service) => void
  setDate:             (date: string) => void
  setSlot:             (slot: TimeSlot) => void
  setNotes:            (notes: string) => void
  reset:               () => void

  getTotalPrice:    () => number
  getTotalDuration: () => number
}

export const useBookingStore = create<BookingState>((set, get) => ({
  step:             'barber',
  selectedBarber:   null,
  selectedServices: [],
  selectedDate:     null,
  selectedSlot:     null,
  notes:            '',

  setStep:    (step)    => set({ step }),
  setBarber:  (barber)  => set({ selectedBarber: barber, selectedSlot: null }),
  setDate:    (date)    => set({ selectedDate: date, selectedSlot: null }),
  setSlot:    (slot)    => set({ selectedSlot: slot }),
  setNotes:   (notes)   => set({ notes }),

  toggleService: (service) => {
    const curr = get().selectedServices
    const exists = curr.find((s) => s.id === service.id)
    set({
      selectedServices: exists
        ? curr.filter((s) => s.id !== service.id)
        : [...curr, service],
      selectedSlot: null,
    })
  },

  reset: () => set({
    step: 'barber', selectedBarber: null, selectedServices: [],
    selectedDate: null, selectedSlot: null, notes: '',
  }),

  getTotalPrice:    () => get().selectedServices.reduce((s, v) => s + v.price, 0),
  getTotalDuration: () => get().selectedServices.reduce((s, v) => s + v.duration, 0),
}))
