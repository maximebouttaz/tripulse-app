// --- ÉVALUATION COMPLÈTE DE L'ATHLÈTE ---
// Orchestre les fonctions de training-metrics.ts pour produire un profil complet.

import { supabase } from './supabase';
import type { StravaActivity, AthleteProfile } from './types';
import {
  estimateFTP,
  estimateLTHR,
  estimateMaxHR,
  estimateThresholdPace,
  estimateCSS,
  calculateHRZones,
  calculatePowerZones,
  calculateHRZoneDistribution,
  calculatePowerZoneDistribution,
  activitiesToDailyTSS,
  calculateCTL,
  calculateATL,
  calculateTSB,
  weeklyVolumeByDiscipline,
  identifyStrengthsWeaknesses,
} from './training-metrics';

export async function assessAthlete(athleteId: number): Promise<AthleteProfile> {
  // 1. Récupérer toutes les activités de l'athlète
  const { data: activities, error } = await supabase
    .from('strava_activities')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('start_date', { ascending: true });

  if (error) {
    throw new Error(`Erreur lecture activités: ${error.message}`);
  }

  const acts = (activities || []) as StravaActivity[];
  console.log(`[Assessment] ${acts.length} activités trouvées pour athlete ${athleteId}`);

  // 2. Estimer les seuils physiologiques
  const ftp = estimateFTP(acts);
  const lthr = estimateLTHR(acts);
  const maxHR = estimateMaxHR(acts);
  const thresholdPace = estimateThresholdPace(acts);
  const css = estimateCSS(acts);

  console.log(`[Assessment] FTP: ${ftp}W | LTHR Bike: ${lthr.bike}bpm | LTHR Run: ${lthr.run}bpm`);
  console.log(`[Assessment] Max HR: ${maxHR}bpm | Allure seuil: ${thresholdPace}s/km | CSS: ${css}s/100m`);

  // 3. Calculer les zones
  const hrZones = maxHR ? calculateHRZones(maxHR) : null;
  const powerZones = ftp ? calculatePowerZones(ftp) : null;

  // 4. Calculer CTL / ATL / TSB
  const dailyTSS = activitiesToDailyTSS(acts, ftp, lthr.bike, lthr.run);
  const ctl = calculateCTL(dailyTSS);
  const atl = calculateATL(dailyTSS);
  const tsb = calculateTSB(ctl, atl);

  console.log(`[Assessment] CTL: ${ctl} | ATL: ${atl} | TSB: ${tsb}`);

  // 5. Distribution par zone
  const hrDistribution = hrZones ? calculateHRZoneDistribution(acts, hrZones) : null;
  const powerDistribution = powerZones ? calculatePowerZoneDistribution(acts, powerZones) : null;

  // 6. Volume hebdomadaire
  const volume = weeklyVolumeByDiscipline(acts, 4);
  console.log(`[Assessment] Volume hebdo: Swim ${volume.swim}min | Bike ${volume.bike}min | Run ${volume.run}min`);

  // 7. Forces et faiblesses
  const { strengths, weaknesses } = identifyStrengthsWeaknesses(
    volume,
    hrDistribution || [0, 0, 0, 0, 0],
    acts
  );

  // 8. Résumé textuel
  const summary = buildSummary(ftp, lthr, thresholdPace, css, ctl, tsb, volume);

  // 9. Construire le profil
  const profile: AthleteProfile = {
    athlete_id: athleteId,
    ftp_watts: ftp,
    lthr_bike: lthr.bike,
    lthr_run: lthr.run,
    threshold_pace_sec: thresholdPace,
    max_hr: maxHR,
    css_pace_sec: css,
    ctl,
    atl,
    tsb,
    weekly_swim_min: volume.swim,
    weekly_bike_min: volume.bike,
    weekly_run_min: volume.run,
    hr_zone_distribution: hrDistribution,
    power_zone_distribution: powerDistribution,
    strengths,
    weaknesses,
    assessment_summary: summary,
    last_assessed_at: new Date().toISOString(),
  };

  // 10. Sauvegarder dans Supabase
  const { error: upsertError } = await supabase
    .from('athlete_profiles')
    .upsert({
      ...profile,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'athlete_id' });

  if (upsertError) {
    console.error('[Assessment] Erreur upsert:', upsertError);
    throw new Error(`Erreur sauvegarde profil: ${upsertError.message}`);
  }

  console.log(`[Assessment] Profil sauvegardé pour athlete ${athleteId}`);
  return profile;
}

function buildSummary(
  ftp: number | null,
  lthr: { bike: number | null; run: number | null },
  thresholdPace: number | null,
  css: number | null,
  ctl: number,
  tsb: number,
  volume: { swim: number; bike: number; run: number }
): string {
  const parts: string[] = [];

  // Niveau de fitness
  if (ctl >= 80) parts.push('Excellent niveau de fitness');
  else if (ctl >= 50) parts.push('Bon niveau de fitness');
  else if (ctl >= 25) parts.push('Fitness modéré');
  else parts.push('Fitness en développement');

  // État de forme
  if (tsb > 15) parts.push('très frais (risque de désentraînement)');
  else if (tsb > 5) parts.push('bien reposé');
  else if (tsb > -10) parts.push('en forme optimale');
  else if (tsb > -25) parts.push('charge productive');
  else parts.push('fatigue élevée, repos recommandé');

  // Seuils
  if (ftp) parts.push(`FTP estimé à ${ftp}W`);
  if (thresholdPace) {
    const min = Math.floor(thresholdPace / 60);
    const sec = thresholdPace % 60;
    parts.push(`allure seuil ${min}:${sec.toString().padStart(2, '0')}/km`);
  }

  // Volume
  const totalMin = volume.swim + volume.bike + volume.run;
  if (totalMin > 0) {
    const totalH = Math.round(totalMin / 60);
    parts.push(`${totalH}h/semaine d'entraînement`);
  }

  return parts.join('. ') + '.';
}
