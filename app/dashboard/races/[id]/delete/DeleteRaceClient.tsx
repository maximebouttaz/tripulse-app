'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import type { Race } from '@/lib/types'

interface Props {
  race: Pick<Race, 'id' | 'name' | 'city' | 'date' | 'category'>
}

export default function DeleteRaceClient({ race }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/races/${race.id}`, {
        method: 'DELETE',
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Une erreur est survenue.')
        return
      }

      router.push('/dashboard/races?success=deleted')
    } catch {
      setError('Impossible de contacter le serveur. Veuillez réessayer.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-white transition-colors">
          Tableau de bord
        </Link>
        <ChevronRight size={14} className="shrink-0" />
        <Link href="/dashboard/races" className="hover:text-white transition-colors">
          Mes courses
        </Link>
        <ChevronRight size={14} className="shrink-0" />
        <span className="text-zinc-300">Supprimer</span>
      </nav>

      {/* Confirmation card */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Supprimer la course</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Cette action est irréversible.</p>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl px-4 py-3 space-y-1">
          <p className="text-white font-semibold">{race.name}</p>
          <p className="text-zinc-400 text-sm">
            {race.city}
            {race.date && ` · ${new Date(race.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            {race.category && ` · ${race.category}`}
          </p>
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed">
          Êtes-vous sûr de vouloir supprimer cette course ? Toutes les données associées seront
          définitivement perdues et cette action ne peut pas être annulée.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/dashboard/races"
            className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            Annuler
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  )
}
