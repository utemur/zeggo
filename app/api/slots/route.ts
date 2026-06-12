import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const staff_id = searchParams.get('staff_id')
  const date = searchParams.get('date')

  if (!staff_id || !date) {
    return NextResponse.json({ error: 'staff_id and date are required' }, { status: 400 })
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('slots')
    .select('id, time')
    .eq('staff_id', staff_id)
    .eq('date', date)
    .eq('is_available', true)
    .order('time', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ slots: data ?? [] })
}
