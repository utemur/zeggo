import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: biz } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()
  if (!biz) return NextResponse.json({ error: 'No business found' }, { status: 404 })

  const { data, error } = await supabase
    .from('services').select('*').eq('business_id', biz.id).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ services: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: biz } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()
  if (!biz) return NextResponse.json({ error: 'No business found' }, { status: 404 })

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name, duration_minutes, price } = body as {
    name?: string; duration_minutes?: number; price?: number
  }

  if (!name?.trim() || !duration_minutes || price == null) {
    return NextResponse.json({ error: 'name, duration_minutes, and price are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('services')
    .insert({ business_id: biz.id, name: name.trim(), duration_minutes, price })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data }, { status: 201 })
}
