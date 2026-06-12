import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
type DayHours = { open: boolean; start: string; end: string }
type WorkingHours = Record<DayKey, DayHours>

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}:00`
}

function generateTimeslots(start: string, end: string, intervalMins = 30): string[] {
  const slots: string[] = []
  let cursor = timeToMinutes(start)
  const endMins = timeToMinutes(end)
  while (cursor + intervalMins <= endMins) {
    slots.push(minutesToTime(cursor))
    cursor += intervalMins
  }
  return slots
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { staff_id, date } = body as { staff_id?: string; date?: string }

  if (!staff_id || !date) {
    return NextResponse.json({ error: 'staff_id and date are required' }, { status: 400 })
  }

  // Verify the staff member belongs to this owner's business
  const { data: staff } = await supabase
    .from('staff')
    .select('id, business_id')
    .eq('id', staff_id)
    .single()

  if (!staff) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, working_hours')
    .eq('id', staff.business_id)
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Skip if slots already exist for this staff + date
  const { count } = await supabase
    .from('slots')
    .select('id', { count: 'exact', head: true })
    .eq('staff_id', staff_id)
    .eq('date', date)

  if (count && count > 0) {
    return NextResponse.json({ message: 'Slots already exist for this date', skipped: true })
  }

  // Determine day of week and working hours
  const dayOfWeek = new Date(date + 'T12:00:00').getDay()
  const dayKey = DAY_KEYS[dayOfWeek]
  const hours = (business.working_hours as WorkingHours | null)?.[dayKey]

  if (!hours?.open) {
    return NextResponse.json({ message: 'Business is closed on this day', skipped: true })
  }

  const times = generateTimeslots(hours.start, hours.end, 30)

  if (times.length === 0) {
    return NextResponse.json({ message: 'No slots to generate for these hours', skipped: true })
  }

  const rows = times.map(time => ({ staff_id, date, time, is_available: true }))

  const { data: inserted, error: insertError } = await supabase
    .from('slots')
    .insert(rows)
    .select('id, time')

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ slots: inserted, count: inserted?.length ?? 0 }, { status: 201 })
}
