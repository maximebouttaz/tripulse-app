import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Cette route est appelée par Strava après que l'utilisateur a accepté.
// Strava nous envoie un "code" qu'on échange contre des tokens d'accès.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // L'utilisateur a refusé l'autorisation
  if (error) {
    console.log('Utilisateur a refusé la connexion Strava:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://tripulse-app.vercel.app'}/settings?strava=error`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://tripulse-app.vercel.app'}/settings?strava=error`
    );
  }

  try {
    // 1. Échanger le code contre des tokens
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Erreur échange token Strava:', await tokenRes.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://tripulse-app.vercel.app'}/settings?strava=error`
      );
    }

    const tokenData = await tokenRes.json();

    // tokenData contient :
    // - access_token : pour appeler l'API (expire dans 6h)
    // - refresh_token : pour renouveler l'access_token
    // - expires_at : timestamp d'expiration
    // - athlete : { id, firstname, lastname, profile... }

    const athleteId = tokenData.athlete.id;

    // 2. Stocker les tokens dans Supabase (upsert = créer ou mettre à jour)
    const { error: dbError } = await supabase
      .from('strava_tokens')
      .upsert({
        athlete_id: athleteId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        athlete_firstname: tokenData.athlete.firstname,
        athlete_lastname: tokenData.athlete.lastname,
        athlete_profile: tokenData.athlete.profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'athlete_id' });

    if (dbError) {
      console.error('Erreur sauvegarde tokens Supabase:', dbError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://tripulse-app.vercel.app'}/settings?strava=error`
      );
    }

    console.log(`✅ Strava connecté pour ${tokenData.athlete.firstname} (ID: ${athleteId})`);

    // 3. Rediriger vers Settings avec un message de succès
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://tripulse-app.vercel.app'}/settings?strava=success&athlete=${athleteId}`
    );

  } catch (err) {
    console.error('Erreur callback Strava:', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://tripulse-app.vercel.app'}/settings?strava=error`
    );
  }
}
