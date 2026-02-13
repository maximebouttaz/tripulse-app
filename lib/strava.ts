import { supabase } from './supabase';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

// --- RAFRAÎCHIR LE TOKEN ---
// Les tokens Strava expirent après 6h. Cette fonction les renouvelle automatiquement.
export async function refreshStravaToken(athleteId: number): Promise<string | null> {
  // 1. Récupérer les tokens actuels depuis Supabase
  const { data: tokenRow, error } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('athlete_id', athleteId)
    .single();

  if (error || !tokenRow) {
    console.error('Token non trouvé pour athlete:', athleteId);
    return null;
  }

  // 2. Si le token est encore valide, on le retourne directement
  const now = Math.floor(Date.now() / 1000);
  if (tokenRow.expires_at > now) {
    return tokenRow.access_token;
  }

  // 3. Sinon, on demande un nouveau token à Strava
  console.log(`🔄 Rafraîchissement du token pour athlete ${athleteId}...`);
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: tokenRow.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    console.error('Erreur refresh token Strava:', await res.text());
    return null;
  }

  const tokens = await res.json();

  // 4. Mettre à jour les tokens dans Supabase
  await supabase
    .from('strava_tokens')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq('athlete_id', athleteId);

  return tokens.access_token;
}

// --- RÉCUPÉRER UNE ACTIVITÉ COMPLÈTE ---
// Appelle l'API Strava pour obtenir tous les détails d'une activité
export async function getStravaActivity(accessToken: string, activityId: number) {
  const res = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.error('Erreur récupération activité Strava:', res.status, await res.text());
    return null;
  }

  return res.json();
}

// --- STOCKER UNE ACTIVITÉ DANS SUPABASE ---
export async function saveActivityToSupabase(activity: any, athleteId: number) {
  const { error } = await supabase
    .from('strava_activities')
    .upsert({
      strava_activity_id: activity.id,
      athlete_id: athleteId,
      name: activity.name,
      type: activity.type,
      sport_type: activity.sport_type,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      average_watts: activity.average_watts,
      max_watts: activity.max_watts,
      weighted_average_watts: activity.weighted_average_watts,
      kilojoules: activity.kilojoules,
      suffer_score: activity.suffer_score,
      average_cadence: activity.average_cadence,
      start_date: activity.start_date,
      start_latlng: activity.start_latlng,
      end_latlng: activity.end_latlng,
      raw_data: activity,
    }, { onConflict: 'strava_activity_id' });

  if (error) {
    console.error('Erreur sauvegarde activité Supabase:', error);
    return false;
  }

  console.log(`💾 Activité ${activity.id} sauvegardée dans Supabase`);
  return true;
}
