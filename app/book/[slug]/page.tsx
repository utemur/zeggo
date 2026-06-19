export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookingWizard from '@/components/BookingWizard'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('businesses')
    .select('name, category')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!data) return { title: 'Book an Appointment' }
  return {
    title: `Book at ${data.name}`,
    description: `Schedule your appointment at ${data.name}`,
  }
}

export default async function BookPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, slug, category')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!business) notFound()

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, duration_minutes, price')
      .eq('business_id', business.id)
      .order('name'),
    supabase
      .from('staff')
      .select('id, name, telegram_id')
      .eq('business_id', business.id)
      .order('name'),
  ])

  return (
    <BookingWizard
      business={business}
      services={services ?? []}
      staff={staff ?? []}
    />
  )
}
