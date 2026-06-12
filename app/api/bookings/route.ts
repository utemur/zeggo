import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const business_id = searchParams.get('business_id')
  const from        = searchParams.get('from')
  const to          = searchParams.get('to')

  if (!business_id) return NextResponse.json({ error: 'business_id required' }, { status: 400 })

  // Verify ownership
  const { data: biz } = await supabase
    .from('businesses').select('id').eq('id', business_id).eq('owner_id', user.id).single()
  if (!biz) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  let query = supabase
    .from('bookings')
    .select('id, client_name, client_phone, booking_datetime, status, services(name), staff(name)')
    .eq('business_id', business_id)
    .order('booking_datetime', { ascending: true })

  if (from) query = query.gte('booking_datetime', from)
  if (to)   query = query.lte('booking_datetime', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bookings: data ?? [] })
}
