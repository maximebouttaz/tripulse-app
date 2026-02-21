import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import DeleteRaceClient from './DeleteRaceClient'
import type { Race } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DeleteRacePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: race, error } = await supabase
    .from('races')
    .select('id, name, city, date, category')
    .eq('id', id)
    .eq('organizer_id', session.user.id)
    .single<Pick<Race, 'id' | 'name' | 'city' | 'date' | 'category'>>()

  if (error || !race) {
    notFound()
  }

  return <DeleteRaceClient race={race} />
}
