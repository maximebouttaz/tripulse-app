import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Lecture rapide du profil athlète caché.
// GET /api/athlete/metrics?athlete_id=126239815
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = Number(searchParams.get('athlete_id'));

  if (!athleteId) {
    return NextResponse.json({ error: 'athlete_id requis' }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from('athlete_profiles')
    .select('*')
    .eq('athlete_id', athleteId)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: 'Profil non trouvé. Lance d\'abord POST /api/athlete/assess.' },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}
