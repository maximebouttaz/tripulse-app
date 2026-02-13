import { NextResponse } from 'next/server';

// 1. GESTION DE LA VÉRIFICATION (GET)
// Strava va appeler cette URL une seule fois pour vérifier que tu es bien le propriétaire.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const hubMode = searchParams.get('hub.mode');
  const hubChallenge = searchParams.get('hub.challenge');
  const hubVerifyToken = searchParams.get('hub.verify_token');

  // On vérifie que le mot de passe correspond à celui de ton .env.local
  if (hubMode === 'subscribe' && hubVerifyToken === process.env.STRAVA_VERIFY_TOKEN) {
    console.log('✅ Webhook Strava vérifié avec succès !');
    // On doit renvoyer le "hub.challenge" au format JSON pour valider
    return NextResponse.json({ 'hub.challenge': hubChallenge });
  }

  return new NextResponse('Non autorisé', { status: 403 });
}

// 2. RÉCEPTION DES DONNÉES (POST)
// C'est ici que Strava envoie les infos quand tu termines une course.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('📨 Notification Strava reçue :', body);

    // On vérifie le type d'événement
    // object_type: 'activity' (une séance)
    // aspect_type: 'create' (nouvelle séance), 'update' (titre modifié), 'delete'
    if (body.object_type === 'activity' && body.aspect_type === 'create') {
      const activityId = body.object_id;
      const ownerId = body.owner_id;

      console.log(`🏃‍♂️ Nouvelle activité détectée ! ID: ${activityId} par User: ${ownerId}`);
      
      // ICI : C'est là qu'on ajoutera la logique pour :
      // 1. Récupérer les détails complets de l'activité (Vitesse, Watts...)
      // 2. L'envoyer à Supabase
      // 3. Demander à l'IA d'analyser
    }

    // Il faut TOUJOURS répondre 200 OK rapidement (sinon Strava réessaie en boucle)
    return NextResponse.json({ message: 'Event received' }, { status: 200 });

  } catch (error) {
    console.error('Erreur Webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}