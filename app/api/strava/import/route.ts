import { NextResponse } from 'next/server';
import { refreshStravaToken, saveActivityToSupabase } from '@/lib/strava';

// Import de toutes les activités historiques depuis Strava.
// Appelle : GET /api/strava/import?athlete_id=126239815
//
// Limites Strava : 100 lectures / 15 min, 1000 / jour.
// On sauvegarde directement les résumés (1 requête par page de 200).
// Pour 1000 activités = seulement 5 requêtes API.

export const maxDuration = 60; // Vercel : max 60s pour les fonctions

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
    const perPage = 200; // Max autorisé par Strava
    let totalImported = 0;
    let hasMore = true;

    while (hasMore) {
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

      // Sauvegarder chaque résumé directement (pas de requête détail)
      for (const activity of activities) {
        try {
          await saveActivityToSupabase(activity, athleteId);
          totalImported++;
        } catch (err) {
          console.error(`[Import] Erreur activité ${activity.id}:`, err);
        }
      }

      console.log(`[Import] Page ${page} : ${activities.length} activités sauvegardées (total: ${totalImported})`);
      page++;
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
