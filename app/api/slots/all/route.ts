import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Returns ALL slots (available + booked) for a staff member on a date
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const staff_id = searchParams.get('staff_id')
  const date     = searchParams.get('date')

  if (!staff_id || !date) {
    return NextResponse.json({ error: 'staff_id and date are required' }, { status: 400 })
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('slots')
    .select('id, time, is_available')
    .eq('staff_id', staff_id)
    .eq('date', date)
    .order('time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ slots: data ?? [] })
}
