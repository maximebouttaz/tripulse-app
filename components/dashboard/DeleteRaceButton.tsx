'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface DeleteRaceButtonProps {
  raceId: number
  raceName: string
}

export default function DeleteRaceButton({ raceId, raceName }: DeleteRaceButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer la course "${raceName}" ?\n\nCette action est irréversible.`
    )
    if (!confirmed) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('races').delete().eq('id', raceId)
      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Une erreur est survenue lors de la suppression.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Supprimer"
      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  )
}
