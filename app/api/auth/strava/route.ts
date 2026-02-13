import { NextResponse } from 'next/server';

// Cette route redirige l'utilisateur vers la page d'autorisation Strava.
// L'utilisateur voit : "TriPulse App veut accéder à vos données Strava"
// S'il accepte, Strava le renvoie vers notre callback avec un code.

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tripulse-app.vercel.app'}/api/auth/strava/callback`;

  // Les "scopes" définissent ce qu'on peut lire :
  // - read : profil public
  // - activity:read_all : toutes les activités (même privées)
  const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize');
  stravaAuthUrl.searchParams.set('client_id', clientId!);
  stravaAuthUrl.searchParams.set('redirect_uri', redirectUri);
  stravaAuthUrl.searchParams.set('response_type', 'code');
  stravaAuthUrl.searchParams.set('scope', 'read,activity:read_all');
  stravaAuthUrl.searchParams.set('approval_prompt', 'auto');

  return NextResponse.redirect(stravaAuthUrl.toString());
}
