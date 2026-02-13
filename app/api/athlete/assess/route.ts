import { NextResponse } from 'next/server';
import { assessAthlete } from '@/lib/athlete-assessment';

// Lance l'évaluation complète d'un athlète.
// POST /api/athlete/assess { athlete_id: 126239815 }
export async function POST(request: Request) {
  try {
    const { athlete_id } = await request.json();

    if (!athlete_id) {
      return NextResponse.json({ error: 'athlete_id requis' }, { status: 400 });
    }

    console.log(`[API] Lancement évaluation pour athlete ${athlete_id}...`);
    const profile = await assessAthlete(athlete_id);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('[API] Erreur assessment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
