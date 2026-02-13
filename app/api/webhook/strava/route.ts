import { NextResponse } from 'next/server';
import { refreshStravaToken, getStravaActivity, saveActivityToSupabase } from '@/lib/strava';
import { assessAthlete } from '@/lib/athlete-assessment';

// 1. GESTION DE LA VÉRIFICATION (GET)
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
// Sur Vercel (serverless), on DOIT traiter AVANT de répondre.
// Sinon la fonction est tuée et le traitement async est perdu.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('Notification Strava reçue :', JSON.stringify(body));

    if (body.object_type === 'activity' && body.aspect_type === 'create') {
      const activityId: number = body.object_id;
      const athleteId: number = body.owner_id;

      console.log(`Nouvelle activité détectée ! ID: ${activityId} par Athlete: ${athleteId}`);

      // Traitement SYNCHRONE : on attend la fin avant de répondre
      await processNewActivity(athleteId, activityId);
    }

    return NextResponse.json({ message: 'Event received' }, { status: 200 });
  } catch (error) {
    console.error('Erreur Webhook:', error);
    // Toujours répondre 200 pour éviter que Strava réessaie en boucle
    return NextResponse.json({ message: 'Event received' }, { status: 200 });
  }
}

// --- TRAITEMENT D'UNE NOUVELLE ACTIVITÉ ---
async function processNewActivity(athleteId: number, activityId: number) {
  try {
    // 1. Récupérer un token valide pour cet athlète
    console.log(`[1/3] Récupération du token pour athlete ${athleteId}...`);
    const accessToken = await refreshStravaToken(athleteId);
    if (!accessToken) {
      console.error(`Pas de token pour athlete ${athleteId}. L'utilisateur doit reconnecter Strava.`);
      return;
    }
    console.log(`[1/3] Token OK`);

    // 2. Appeler l'API Strava pour les détails complets
    console.log(`[2/3] Récupération de l'activité ${activityId} depuis Strava...`);
    const activity = await getStravaActivity(accessToken, activityId);
    if (!activity) {
      console.error(`Impossible de récupérer l'activité ${activityId}`);
      return;
    }
    console.log(`[2/3] Activité récupérée : ${activity.name} (${activity.type}) - ${(activity.distance / 1000).toFixed(1)}km`);

    // 3. Sauvegarder dans Supabase
    console.log(`[3/3] Sauvegarde dans Supabase...`);
    const saved = await saveActivityToSupabase(activity, athleteId);
    if (saved) {
      console.log(`[3/3] Activité ${activityId} sauvegardée avec succès !`);

      // 4. Recalculer les métriques de l'athlète (CTL/ATL/TSB, zones...)
      console.log(`[4/4] Mise à jour des métriques pour athlete ${athleteId}...`);
      try {
        await assessAthlete(athleteId);
        console.log(`[4/4] Métriques mises à jour !`);
      } catch (assessErr) {
        console.error(`[4/4] Erreur mise à jour métriques:`, assessErr);
      }
    } else {
      console.error(`[3/4] Échec de la sauvegarde de l'activité ${activityId}`);
    }
  } catch (error) {
    console.error(`Erreur traitement activité ${activityId}:`, error);
  }
}
