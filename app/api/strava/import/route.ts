import { NextResponse } from 'next/server';
import { refreshStravaToken, getStravaActivity, saveActivityToSupabase } from '@/lib/strava';

// Import des activités historiques depuis Strava.
//
// Mode rapide (résumés) : /api/strava/import?athlete_id=126239815
//   → 1 requête / page de 200. Idéal pour tout l'historique.
//
// Mode détaillé : /api/strava/import?athlete_id=126239815&detailed=true&limit=50
//   → 1 requête liste + 1 requête / activité. Données précises (watts, cadence, splits...).
//   → Limité aux N activités les plus récentes pour respecter les rate limits.
//
// Limites Strava : 100 lectures / 15 min, 1000 / jour.

export const maxDuration = 300; // 5 min max (Vercel Pro) / 60s sur plan gratuit

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = Number(searchParams.get('athlete_id'));
  const detailed = searchParams.get('detailed') === 'true';
  const limit = Number(searchParams.get('limit')) || (detailed ? 50 : 0); // 0 = tout

  if (!athleteId) {
    return NextResponse.json({ error: 'athlete_id requis' }, { status: 400 });
  }

  try {
    const accessToken = await refreshStravaToken(athleteId);
    if (!accessToken) {
      return NextResponse.json({ error: 'Token non trouvé. Reconnecte Strava.' }, { status: 401 });
    }

    if (detailed) {
      // MODE DÉTAILLÉ : données précises pour les activités récentes
      const result = await importDetailed(accessToken, athleteId, limit);
      return NextResponse.json(result);
    } else {
      // MODE RAPIDE : résumés pour tout l'historique
      const result = await importSummaries(accessToken, athleteId, limit);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('[Import] Erreur:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'import' }, { status: 500 });
  }
}

// --- MODE RAPIDE : résumés seulement (1 requête / 200 activités) ---
async function importSummaries(accessToken: string, athleteId: number, limit: number) {
  let page = 1;
  const perPage = 200;
  let totalImported = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`[Import Rapide] Page ${page}...`);
    const listRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      console.error(`[Import] Erreur:`, listRes.status, await listRes.text());
      break;
    }

    const activities = await listRes.json();
    if (activities.length === 0) break;

    for (const activity of activities) {
      await saveActivityToSupabase(activity, athleteId);
      totalImported++;
      if (limit > 0 && totalImported >= limit) { hasMore = false; break; }
    }

    console.log(`[Import Rapide] Page ${page} : ${activities.length} activités (total: ${totalImported})`);
    if (!hasMore) break;
    page++;
  }

  return { success: true, mode: 'rapide', total: totalImported };
}

// --- MODE DÉTAILLÉ : données complètes (watts, cadence, splits, best efforts) ---
async function importDetailed(accessToken: string, athleteId: number, limit: number) {
  // 1. Récupérer la liste des activités récentes
  const perPage = Math.min(limit, 200);
  console.log(`[Import Détaillé] Récupération des ${limit} dernières activités...`);

  const listRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?page=1&per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!listRes.ok) {
    return { success: false, error: `Erreur API: ${listRes.status}` };
  }

  const summaries = await listRes.json();
  let totalImported = 0;
  let totalErrors = 0;
  const requestCount = 1; // On a déjà fait 1 requête pour la liste

  // 2. Pour chaque activité, récupérer les détails complets
  for (let i = 0; i < summaries.length; i++) {
    const summary = summaries[i];

    // Pause toutes les 80 requêtes pour respecter le rate limit (100 / 15 min)
    if ((requestCount + i) % 80 === 0) {
      console.log(`[Import Détaillé] Pause 60s pour rate limit...`);
      await new Promise((r) => setTimeout(r, 60000));
    }

    try {
      const detail = await getStravaActivity(accessToken, summary.id);
      if (detail) {
        await saveActivityToSupabase(detail, athleteId);
        totalImported++;
        console.log(`[Import Détaillé] ${totalImported}/${summaries.length} - ${detail.name} (${detail.sport_type})`);
      }
    } catch (err) {
      totalErrors++;
      console.error(`[Import Détaillé] Erreur activité ${summary.id}:`, err);
    }
  }

  return {
    success: true,
    mode: 'détaillé',
    total: totalImported,
    errors: totalErrors,
    message: `${totalImported} activités importées avec données complètes (watts, cadence, splits...)`,
  };
}
