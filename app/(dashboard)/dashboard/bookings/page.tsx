'use client'

import { useEffect, useState, useCallback } from 'react'

type Booking = {
  id: string
  client_name: string
  client_phone: string
  booking_datetime: string
  status: string
  services: { name: string }[] | null
  staff: { name: string }[] | null
}

type Filter = 'today' | 'upcoming' | 'all'

const STATUS_CYCLE: Record<string, string> = {
  pending:   'confirmed',
  confirmed: 'completed',
  completed: 'completed',
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

export default function BookingsPage() {
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [filter, setFilter]       = useState<Filter>('upcoming')
  const [loading, setLoading]     = useState(true)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)

  // Fetch business id once
  useEffect(() => {
    fetch('/api/business')
      .then(r => r.json())
      .then(d => { if (d.business) setBusinessId(d.business.id) })
  }, [])

  const loadBookings = useCallback(async () => {
    if (!businessId) return
    setLoading(true)

    const now   = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0]

    let url = `/api/bookings?business_id=${businessId}`
    if (filter === 'today')    url += `&from=${today}T00:00:00&to=${today}T23:59:59`
    if (filter === 'upcoming') url += `&from=${now}`

    const res  = await fetch(url)
    const data = await res.json()
    setBookings(data.bookings ?? [])
    setLoading(false)
  }, [businessId, filter])

  useEffect(() => { loadBookings() }, [loadBookings])

  const advanceStatus = async (booking: Booking) => {
    const next = STATUS_CYCLE[booking.status]
    if (!next || next === booking.status) return
    setAdvancing(booking.id)
    try {
      await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      setBookings(prev =>
        prev.map(b => b.id === booking.id ? { ...b, status: next } : b)
      )
    } finally {
      setAdvancing(null)
    }
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'today',    label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'all',      label: 'All' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bookings.length} booking{bookings.length !== 1 ? 's' : ''} shown</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filter === f.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No bookings found for this filter.</p>
          </div>
        ) : (
          <>
            {/* Table header — hidden on mobile */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto] gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50">
              {['Client', 'Service', 'Staff', 'Date & Time', 'Status', ''].map(h => (
                <span key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            <ul className="divide-y divide-gray-100">
              {bookings.map(b => (
                <li key={b.id} className="px-6 py-4 sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] sm:gap-4 sm:items-center flex flex-col gap-2">
                  {/* Client */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{b.client_name}</p>
                    <p className="text-xs text-gray-500">{b.client_phone}</p>
                  </div>
                  {/* Service */}
                  <p className="text-sm text-gray-700">{b.services?.[0]?.name ?? '—'}</p>
                  {/* Staff */}
                  <p className="text-sm text-gray-700">{b.staff?.[0]?.name ?? '—'}</p>
                  {/* Date */}
                  <p className="text-sm text-gray-700">{fmt(b.booking_datetime)}</p>
                  {/* Status badge */}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {b.status}
                  </span>
                  {/* Advance button */}
                  {STATUS_CYCLE[b.status] !== b.status && (
                    <button
                      onClick={() => advanceStatus(b)}
                      disabled={advancing === b.id}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 whitespace-nowrap transition-colors"
                    >
                      {advancing === b.id ? '…' : `→ ${STATUS_CYCLE[b.status]}`}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
