import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import EditRaceClient from './EditRaceClient'
import type { Race } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditRacePage({ params }: Props) {
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
    .select('*')
    .eq('id', id)
    .eq('organizer_id', session.user.id)
    .single<Race & { status: string; organizer_id: string }>()

  if (error || !race) {
    notFound()
  }

  return <EditRaceClient race={race} />
}
