import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { status } = body as { status?: string }
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }

  // Verify the booking belongs to this owner via business
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, business_id')
    .eq('id', params.id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const { data: biz } = await supabase
    .from('businesses').select('id').eq('id', booking.business_id).eq('owner_id', user.id).single()
  if (!biz) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', params.id)
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ booking: data })
}
