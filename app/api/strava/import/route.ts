import { NextResponse } from 'next/server';
import { refreshStravaToken, getStravaActivity, saveActivityToSupabase } from '@/lib/strava';

// Import de toutes les activités historiques depuis Strava.
// Appelle : GET /api/strava/import?athlete_id=126239815
// Strava limite à 100 requêtes / 15 min et 1000 / jour.
// On récupère les résumés par page, puis les détails un par un.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = Number(searchParams.get('athlete_id'));

  if (!athleteId) {
    return NextResponse.json({ error: 'athlete_id requis' }, { status: 400 });
  }

  try {
    // 1. Récupérer un token valide
    const accessToken = await refreshStravaToken(athleteId);
    if (!accessToken) {
      return NextResponse.json({ error: 'Token non trouvé. Reconnecte Strava.' }, { status: 401 });
    }

    let page = 1;
    const perPage = 50;
    let totalImported = 0;
    let hasMore = true;

    while (hasMore) {
      // 2. Récupérer une page de résumés d'activités
      console.log(`[Import] Page ${page}...`);
      const listRes = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!listRes.ok) {
        const errText = await listRes.text();
        console.error(`[Import] Erreur liste activités:`, listRes.status, errText);
        break;
      }

      const activities = await listRes.json();

      if (activities.length === 0) {
        hasMore = false;
        break;
      }

      // 3. Pour chaque activité, récupérer les détails complets et sauvegarder
      for (const summary of activities) {
        try {
          const detail = await getStravaActivity(accessToken, summary.id);
          if (detail) {
            await saveActivityToSupabase(detail, athleteId);
            totalImported++;
            console.log(`[Import] ${totalImported} - ${detail.name} (${detail.type})`);
          }
        } catch (err) {
          console.error(`[Import] Erreur activité ${summary.id}:`, err);
        }
      }

      page++;

      // Pause de 2s entre les pages pour respecter les rate limits Strava
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return NextResponse.json({
      success: true,
      message: `${totalImported} activités importées avec succès`,
      total: totalImported,
    });
  } catch (error) {
    console.error('[Import] Erreur:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'import' }, { status: 500 });
  }
}
