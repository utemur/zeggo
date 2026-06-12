'use client'

import { useState, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────
type Business = { id: string; name: string; slug: string; category: string | null }
type Service  = { id: string; name: string; duration_minutes: number; price: number }
type Staff    = { id: string; name: string; telegram_id: string | null }
type Slot     = { id: string; time: string }
type Booking  = { id: string; booking_datetime: string; status: string }

// ── Helpers ──────────────────────────────────────────────────
const formatSum = (price: number) =>
  price.toLocaleString('ru-RU') + " so'm"

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`
}

const formatTime = (time: string) => {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

const formatDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

// ── Mini calendar ─────────────────────────────────────────────
function MiniCalendar({
  year, month, selected, todayStr,
  onSelect, onPrev, onNext,
}: {
  year: number; month: number
  selected: string | null; todayStr: string
  onSelect: (d: string) => void
  onPrev: () => void; onNext: () => void
}) {
  const daysInMonth   = new Date(year, month + 1, 0).getDate()
  const rawFirstDay   = new Date(year, month, 1).getDay()
  const startOffset   = (rawFirstDay + 6) % 7 // Monday-first

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })

  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrev}
          disabled={isCurrentMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
        <button
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const isPast     = ds < todayStr
          const isToday    = ds === todayStr
          const isSelected = ds === selected
          return (
            <button
              key={i}
              onClick={() => !isPast && onSelect(ds)}
              disabled={isPast}
              className={[
                'flex items-center justify-center aspect-square rounded-lg text-sm font-medium transition-all select-none',
                isSelected ? 'bg-indigo-600 text-white shadow-sm' : '',
                isToday && !isSelected ? 'ring-2 ring-indigo-400 ring-offset-1 text-indigo-700' : '',
                !isSelected && !isPast ? 'hover:bg-indigo-50 text-gray-700 cursor-pointer' : '',
                isPast ? 'text-gray-300 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────
const STEP_LABELS = ['Service', 'Staff', 'Date & Time', 'Details', 'Done']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEP_LABELS.map((label, i) => {
        const n    = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={n} className="flex items-center">
            <div
              title={label}
              className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                active ? 'bg-indigo-600 text-white' : '',
                done   ? 'bg-indigo-100 text-indigo-600' : '',
                !active && !done ? 'bg-gray-100 text-gray-400' : '',
              ].join(' ')}
            >
              {done ? '✓' : n}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-5 sm:w-8 h-0.5 mx-0.5 transition-colors ${done ? 'bg-indigo-300' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Confirmation row ──────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────
export default function BookingWizard({
  business, services, staff,
}: {
  business: Business
  services: Service[]
  staff: Staff[]
}) {
  const [step, setStep]               = useState(1)
  const [service, setService]         = useState<Service | null>(null)
  const [staffMember, setStaffMember] = useState<Staff | null>(null)
  const [date, setDate]               = useState<string | null>(null)
  const [slot, setSlot]               = useState<Slot | null>(null)
  const [slots, setSlots]             = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [clientName, setClientName]   = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [booking, setBooking]         = useState<Booking | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  const today      = new Date()
  const todayStr   = today.toISOString().split('T')[0]
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear,  setCalYear]  = useState(today.getFullYear())

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  // Fetch slots when date or staff changes
  useEffect(() => {
    if (!date || !staffMember) return
    setSlots([])
    setSlot(null)
    setLoadingSlots(true)
    fetch(`/api/slots?staff_id=${staffMember.id}&date=${date}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [date, staffMember])

  const handleBook = async () => {
    if (!service || !staffMember || !slot || !clientName.trim() || !clientPhone.trim()) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          service_id: service.id,
          staff_id: staffMember.id,
          slot_id: slot.id,
          client_name: clientName.trim(),
          client_phone: clientPhone.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed')
      setBooking(data.booking)
      setStep(5)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setStep(1); setService(null); setStaffMember(null)
    setDate(null); setSlot(null); setSlots([])
    setClientName(''); setClientPhone('')
    setBooking(null); setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-0.5">
            {business.category ?? 'Business'}
          </p>
          <h1 className="text-lg font-extrabold text-gray-900 leading-tight">{business.name}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-16">
        {step < 5 && <StepIndicator current={step} />}

        {/* ── Step 1: Service ── */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Choose a service</h2>
            {services.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No services available yet.</p>
            ) : (
              <div className="space-y-2">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setService(s); setStep(2) }}
                    className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-indigo-400 hover:shadow-sm transition-all text-left active:scale-[0.99]"
                  >
                    <div className="min-w-0 mr-4">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{formatDuration(s.duration_minutes)}</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 whitespace-nowrap">
                      {formatSum(s.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Staff ── */}
        {step === 2 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Choose a staff member</h2>
            {staff.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No staff members available.</p>
            ) : (
              <div className="space-y-2">
                {staff.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setStaffMember(s); setStep(3) }}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-indigo-400 hover:shadow-sm transition-all text-left active:scale-[0.99]"
                  >
                    <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-indigo-700 font-bold text-base">
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep(1)} className="mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 3: Date + time ── */}
        {step === 3 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Pick a date and time</h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
              <MiniCalendar
                year={calYear} month={calMonth}
                selected={date} todayStr={todayStr}
                onSelect={d => { setDate(d); setSlot(null) }}
                onPrev={prevMonth} onNext={nextMonth}
              />
            </div>

            {date && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {formatDate(date)}
                </p>
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-11 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No available slots for this day.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSlot(s)}
                        className={[
                          'py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
                          slot?.id === s.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50',
                        ].join(' ')}
                      >
                        {formatTime(s.time)}
                      </button>
                    ))}
                  </div>
                )}

                {slot && (
                  <button
                    onClick={() => setStep(4)}
                    className="mt-4 w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors active:scale-[0.99]"
                  >
                    Continue →
                  </button>
                )}
              </div>
            )}

            <button onClick={() => setStep(2)} className="mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 4: Client details ── */}
        {step === 4 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Your details</h2>

            {/* Booking summary pill */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5">
              <p className="text-sm font-semibold text-indigo-900">{service?.name}</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                {staffMember?.name} · {date && formatDate(date)} · {slot && formatTime(slot.time)}
              </p>
              <p className="text-xs text-indigo-700 font-bold mt-1">
                {service && formatSum(service.price)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone number</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={submitting || !clientName.trim() || !clientPhone.trim()}
              className="mt-6 w-full py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.99]"
            >
              {submitting ? 'Confirming…' : 'Confirm Booking'}
            </button>

            <button onClick={() => setStep(3)} className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors block">
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 5: Confirmation ── */}
        {step === 5 && booking && (
          <div className="text-center pt-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">You're booked!</h2>
            <p className="text-sm text-gray-500 mb-6">
              We'll be expecting you. See the details below.
            </p>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-left mb-6 space-y-3">
              <Row label="Business" value={business.name} />
              <Row label="Service"  value={service?.name ?? '—'} />
              <Row label="Price"    value={service ? formatSum(service.price) : '—'} />
              <Row label="Staff"    value={staffMember?.name ?? '—'} />
              <Row label="Date"     value={date ? formatDate(date) : '—'} />
              <Row label="Time"     value={slot ? formatTime(slot.time) : '—'} />
              <div className="border-t border-gray-100 pt-3">
                <Row label="Name"  value={clientName} />
                <Row label="Phone" value={clientPhone} />
              </div>
              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-400 text-center">
                  Ref: <span className="font-mono font-semibold">{booking.id.split('-')[0].toUpperCase()}</span>
                </p>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Book Another Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
