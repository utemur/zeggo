import { createClient } from '@/lib/supabase/server'
import { sendTelegramMessage } from '@/lib/telegram'
import { scheduleReminder } from '@/lib/reminder'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { business_id, service_id, staff_id, slot_id, client_name, client_phone } =
    body as {
      business_id?: string
      service_id?: string
      staff_id?: string
      slot_id?: string
      client_name?: string
      client_phone?: string
    }

  if (!business_id || !service_id || !staff_id || !slot_id || !client_name?.trim() || !client_phone?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const supabase = createClient()

  // Atomically claim the slot: only succeeds if it's still available
  const { data: claimed, error: slotError } = await supabase
    .from('slots')
    .update({ is_available: false })
    .eq('id', slot_id)
    .eq('is_available', true)
    .select('id, date, time')
    .single()

  if (slotError || !claimed) {
    return NextResponse.json(
      { error: 'This slot is no longer available. Please choose another time.' },
      { status: 409 }
    )
  }

  const booking_datetime = `${claimed.date}T${claimed.time}`

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      business_id,
      service_id,
      staff_id,
      client_name: client_name.trim(),
      client_phone: client_phone.trim(),
      booking_datetime,
    })
    .select('id, booking_datetime, status')
    .single()

  if (bookingError) {
    // Release the slot so it can be booked again
    await supabase.from('slots').update({ is_available: true }).eq('id', slot_id)
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // ── Post-booking side-effects (non-blocking) ──────────────
  void notifyAndSchedule({
    supabase,
    business_id,
    service_id,
    staff_id,
    booking: {
      id: booking.id,
      client_name: client_name.trim(),
      client_phone: client_phone.trim(),
      booking_datetime,
    },
    date: claimed.date as string,
    time: claimed.time as string,
  })

  return NextResponse.json({ booking }, { status: 201 })
}

// Runs after the response is returned — failures don't affect the booking
async function notifyAndSchedule({
  supabase, business_id, service_id, staff_id, booking, date, time,
}: {
  supabase: ReturnType<typeof createClient>
  business_id: string
  service_id: string
  staff_id: string
  booking: { id: string; client_name: string; client_phone: string; booking_datetime: string }
  date: string
  time: string
}) {
  try {
    // Fetch business chat_id, service name, staff name in parallel
    const [{ data: business }, { data: service }, { data: staff }] = await Promise.all([
      supabase.from('businesses').select('telegram_chat_id').eq('id', business_id).single(),
      supabase.from('services').select('name').eq('id', service_id).single(),
      supabase.from('staff').select('name').eq('id', staff_id).single(),
    ])

    // Format date/time for the message
    const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    const [h, m] = time.split(':')
    const timeLabel = `${h}:${m}`

    const message =
      `🔔 <b>Новая запись!</b>\n` +
      `👤 ${booking.client_name}\n` +
      `📞 ${booking.client_phone}\n` +
      `💼 ${service?.name ?? '—'}\n` +
      `👨‍💼 ${staff?.name ?? '—'}\n` +
      `📅 ${dateLabel} в ${timeLabel}`

    if (business?.telegram_chat_id) {
      await sendTelegramMessage(business.telegram_chat_id, message)
    }

    scheduleReminder(booking)
  } catch (err) {
    console.error('[book] Post-booking notification error:', err)
  }
}
