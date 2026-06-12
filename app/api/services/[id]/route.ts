import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership via business
  const { data: service } = await supabase
    .from('services').select('business_id').eq('id', params.id).single()
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: biz } = await supabase
    .from('businesses').select('id').eq('id', service.business_id).eq('owner_id', user.id).single()
  if (!biz) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { error } = await supabase.from('services').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
