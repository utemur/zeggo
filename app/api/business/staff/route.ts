import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAuthedBusiness(supabase: ReturnType<typeof import('@/lib/supabase/server').createClient>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { user: null, business: null, error: 'Unauthorized', status: 401 }

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()
  if (!business) return { user, business: null, error: 'No business found for this user', status: 404 }

  return { user, business, error: null, status: 200 }
}

export async function GET() {
  const supabase = createClient()
  const { business, error, status } = await getAuthedBusiness(supabase)
  if (error) return NextResponse.json({ error }, { status })

  const { data, error: dbError } = await supabase
    .from('staff')
    .select('id, name, telegram_id')
    .eq('business_id', business!.id)
    .order('name')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ staff: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { business, error, status } = await getAuthedBusiness(supabase)
  if (error) return NextResponse.json({ error }, { status })

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name, telegram_id } = body as { name?: string; telegram_id?: string | null }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Staff name is required' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase
    .from('staff')
    .insert({
      business_id: business!.id,
      name: name.trim(),
      telegram_id: telegram_id?.trim() || null,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ staff: data }, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const { business, error, status } = await getAuthedBusiness(supabase)
  if (error) return NextResponse.json({ error }, { status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // Verify the staff member belongs to this business
  const { data: member } = await supabase
    .from('staff').select('id').eq('id', id).eq('business_id', business!.id).single()
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error: dbError } = await supabase.from('staff').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
