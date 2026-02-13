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

  const [profileRes, tokenRes] = await Promise.all([
    supabase.from('athlete_profiles').select('*').eq('athlete_id', athleteId).single(),
    supabase.from('strava_tokens').select('athlete_firstname, athlete_lastname, athlete_profile').eq('athlete_id', athleteId).single(),
  ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json(
      { error: 'Profil non trouvé. Lance d\'abord POST /api/athlete/assess.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...profileRes.data,
    athlete_firstname: tokenRes.data?.athlete_firstname ?? null,
    athlete_lastname: tokenRes.data?.athlete_lastname ?? null,
    athlete_photo: tokenRes.data?.athlete_profile ?? null,
  });
}
