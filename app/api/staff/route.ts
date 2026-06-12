import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const business_id = searchParams.get('business_id')

  let bizId: string

  if (business_id) {
    // Explicit business_id: verify ownership
    const { data: biz } = await supabase
      .from('businesses').select('id').eq('id', business_id).eq('owner_id', user.id).single()
    if (!biz) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    bizId = biz.id
  } else {
    // No business_id: look up from authenticated user
    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) return NextResponse.json({ error: 'No business found' }, { status: 404 })
    bizId = biz.id
  }

  const { data, error } = await supabase
    .from('staff').select('id, name, telegram_id').eq('business_id', bizId).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ staff: data ?? [] })
}
