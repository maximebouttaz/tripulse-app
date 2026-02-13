import { NextResponse } from 'next/server';
import { refreshStravaToken, getStravaActivity, saveActivityToSupabase } from '@/lib/strava';

// 1. GESTION DE LA VÉRIFICATION (GET)
// Strava appelle cette URL une seule fois pour vérifier que tu es le propriétaire.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const hubMode = searchParams.get('hub.mode');
  const hubChallenge = searchParams.get('hub.challenge');
  const hubVerifyToken = searchParams.get('hub.verify_token');

  if (hubMode === 'subscribe' && hubVerifyToken === process.env.STRAVA_VERIFY_TOKEN) {
    console.log('Webhook Strava vérifié avec succès !');
    return NextResponse.json({ 'hub.challenge': hubChallenge });
  }

  return new NextResponse('Non autorisé', { status: 403 });
}

// 2. RÉCEPTION DES DONNÉES (POST)
// Strava envoie une notification ici à chaque nouvelle activité.
// IMPORTANT : On doit répondre 200 en moins de 2 secondes, sinon Strava réessaie.
// Le traitement lourd (fetch activité + sauvegarde) se fait de manière asynchrone.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('Notification Strava reçue :', JSON.stringify(body));

    if (body.object_type === 'activity' && body.aspect_type === 'create') {
      const activityId: number = body.object_id;
      const athleteId: number = body.owner_id;

      console.log(`Nouvelle activité détectée ! ID: ${activityId} par Athlete: ${athleteId}`);

      // Traitement asynchrone : on ne bloque pas la réponse
      processNewActivity(athleteId, activityId).catch((err) =>
        console.error('Erreur traitement activité:', err)
      );
    }

    // Répondre immédiatement 200 OK (obligatoire pour Strava)
    return NextResponse.json({ message: 'Event received' }, { status: 200 });
  } catch (error) {
    console.error('Erreur Webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- TRAITEMENT D'UNE NOUVELLE ACTIVITÉ ---
async function processNewActivity(athleteId: number, activityId: number) {
  // 1. Récupérer un token valide pour cet athlète
  const accessToken = await refreshStravaToken(athleteId);
  if (!accessToken) {
    console.error(`Pas de token pour athlete ${athleteId}. L'utilisateur doit reconnecter Strava.`);
    return;
  }

  // 2. Appeler l'API Strava pour les détails complets
  const activity = await getStravaActivity(accessToken, activityId);
  if (!activity) {
    console.error(`Impossible de récupérer l'activité ${activityId}`);
    return;
  }

  console.log(`Activité récupérée : ${activity.name} (${activity.type}) - ${(activity.distance / 1000).toFixed(1)}km`);

  // 3. Sauvegarder dans Supabase
  await saveActivityToSupabase(activity, athleteId);
}
