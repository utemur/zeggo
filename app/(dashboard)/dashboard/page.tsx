export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Booking = {
  id: string
  client_name: string
  client_phone: string
  booking_datetime: string
  status: string
  services: { name: string }[] | null
  staff: { name: string }[] | null
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!business) redirect('/onboarding')

  const today = new Date().toISOString().split('T')[0]
  const nowIso = new Date().toISOString()

  const [{ count: todayCount }, { data: upcoming }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('booking_datetime', `${today}T00:00:00`)
      .lte('booking_datetime', `${today}T23:59:59`),

    supabase
      .from('bookings')
      .select('id, client_name, client_phone, booking_datetime, status, services(name), staff(name)')
      .eq('business_id', business.id)
      .gte('booking_datetime', nowIso)
      .order('booking_datetime', { ascending: true })
      .limit(5),
  ])

  const bookings = (upcoming ?? []) as Booking[]

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })

  const STATUS_STYLES: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-8 max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">
          {business.category ?? 'Business'} · {business.plan} plan · /{business.slug}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Today</p>
          <p className="text-3xl font-bold text-gray-900">{todayCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">bookings</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Upcoming</p>
          <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">scheduled</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Plan</p>
          <p className="text-3xl font-bold text-gray-900 capitalize">{business.plan}</p>
          <p className="text-xs text-gray-400 mt-0.5">current tier</p>
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Upcoming Bookings</h2>
        </div>

        {bookings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">No upcoming bookings yet.</p>
            <p className="text-gray-400 text-xs mt-1">Share your booking link to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bookings.map(b => (
              <li key={b.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{b.client_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.services?.[0]?.name ?? '—'} · {b.staff?.[0]?.name ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.client_phone}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-500 text-right">{fmt(b.booking_datetime)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
