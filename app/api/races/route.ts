import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

function makeSlug(name: string, city: string, year: number): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  return `${normalize(name)}-${normalize(city)}-${year}`
}

function toNumberOrNull(val: unknown): number | null {
  if (val === '' || val === null || val === undefined) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const { name, date, city, category } = body

  // Required field validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Le nom est requis.' }, { status: 400 })
  }
  if (!date || typeof date !== 'string') {
    return NextResponse.json({ error: 'La date est requise.' }, { status: 400 })
  }
  if (!city || typeof city !== 'string' || !city.trim()) {
    return NextResponse.json({ error: 'La ville est requise.' }, { status: 400 })
  }
  if (!category || typeof category !== 'string') {
    return NextResponse.json({ error: 'La catégorie est requise.' }, { status: 400 })
  }

  const year = new Date(date).getFullYear()
  const baseSlug = makeSlug(name as string, city as string, year)

  // Ensure slug uniqueness by appending a suffix if needed
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data: existing } = await supabase
      .from('races')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  const insertData = {
    name: (name as string).trim(),
    date: date as string,
    city: (city as string).trim(),
    department: body.department ? String(body.department).trim() || null : null,
    region: body.region ? String(body.region).trim() || null : null,
    country: body.country ? String(body.country).trim() || 'France' : 'France',
    category: category as string,
    discipline: body.discipline ? String(body.discipline).trim() || 'triathlon' : 'triathlon',
    swim_distance: toNumberOrNull(body.swim_distance),
    bike_distance: toNumberOrNull(body.bike_distance),
    run_distance: toNumberOrNull(body.run_distance),
    total_elevation: toNumberOrNull(body.total_elevation),
    price_euros: toNumberOrNull(body.price_euros),
    max_participants: toNumberOrNull(body.max_participants),
    time_limit_hours: toNumberOrNull(body.time_limit_hours),
    description: body.description ? String(body.description).trim() || null : null,
    website_url: body.website_url ? String(body.website_url).trim() || null : null,
    slug,
    organizer_id: session.user.id,
    status: 'pending',
    // Derived location field (city, country)
    location: `${(city as string).trim()}, ${body.country ? String(body.country).trim() || 'France' : 'France'}`,
  }

  const { data: race, error } = await supabase
    .from('races')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/races]', error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la course. Veuillez réessayer." },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, race }, { status: 201 })
}
