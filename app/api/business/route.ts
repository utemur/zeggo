import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ business: data })
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, telegram_chat_id } = body as {
    name?: string
    telegram_chat_id?: string
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('businesses')
    .update({ name: name.trim(), telegram_chat_id: telegram_chat_id?.trim() || null })
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ business: data })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, category, working_hours } = body as {
    name?: string
    category?: string
    working_hours?: Record<string, unknown>
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
  }

  const slug = slugify(name)

  const { data, error } = await supabase
    .from('businesses')
    .insert({ owner_id: user.id, name: name.trim(), slug, category, working_hours })
    .select()
    .single()

  if (error) {
    // Unique constraint on slug
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A business with that name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ business: data }, { status: 201 })
}
