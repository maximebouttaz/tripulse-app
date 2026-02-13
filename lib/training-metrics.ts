// --- MOTEUR ALGORITHMIQUE D'ENTRAÎNEMENT ---
// Fonctions pures : pas de DB, pas de réseau. Calculs uniquement.

import type { StravaActivity, DailyTSS, Zones, PowerZones, ZoneRange } from './types';

// =============================================================================
// TSS (Training Stress Score)
// =============================================================================

// TSS basé sur la puissance (vélo)
function powerTSS(movingTime: number, normalizedPower: number, ftp: number): number {
  const intensityFactor = normalizedPower / ftp;
  return (movingTime * normalizedPower * intensityFactor) / (ftp * 3600) * 100;
}

// TSS basé sur la FC (course, natation sans puissance)
function hrTSS(movingTime: number, avgHR: number, lthr: number): number {
  const intensityFactor = avgHR / lthr;
  // Formule simplifiée : hrTSS ≈ durée(h) × IF² × 100
  return (movingTime / 3600) * Math.pow(intensityFactor, 2) * 100;
}

// Estimation du TSS pour une activité quelconque
export function estimateTSS(
  activity: StravaActivity,
  ftp: number | null,
  lthrBike: number | null,
  lthrRun: number | null
): number {
  const isRide = activity.type?.includes('Ride') || activity.sport_type?.includes('Ride');
  const isRun = activity.type === 'Run' || activity.sport_type?.includes('Run');
  const isSwim = activity.type === 'Swim' || activity.sport_type?.includes('Swim');

  // 1. Vélo avec puissance → meilleur calcul
  if (isRide && activity.weighted_average_watts && ftp && ftp > 0) {
    return powerTSS(activity.moving_time, activity.weighted_average_watts, ftp);
  }

  // 2. Vélo avec FC (pas de capteur de puissance)
  if (isRide && activity.average_heartrate && lthrBike && lthrBike > 0) {
    return hrTSS(activity.moving_time, activity.average_heartrate, lthrBike);
  }

  // 3. Course avec FC
  if (isRun && activity.average_heartrate && lthrRun && lthrRun > 0) {
    return hrTSS(activity.moving_time, activity.average_heartrate, lthrRun);
  }

  // 4. Natation → estimation basée sur la durée et l'intensité perçue
  if (isSwim) {
    // Approximation : 1h de natation ≈ 50-80 TSS
    return (activity.moving_time / 3600) * 65;
  }

  // 5. Fallback : suffer_score de Strava (si disponible)
  if (activity.suffer_score) {
    return activity.suffer_score * 1.2;
  }

  // 6. Dernier recours : estimation basée sur la durée
  return (activity.moving_time / 3600) * 50;
}

// =============================================================================
// CTL / ATL / TSB (Performance Management Chart)
// =============================================================================

// Moyenne pondérée exponentiellement
function ewma(dailyTSS: DailyTSS[], timeConstant: number): number {
  if (dailyTSS.length === 0) return 0;

  // Trier par date croissante
  const sorted = [...dailyTSS].sort((a, b) => a.date.localeCompare(b.date));
  const decay = 1 - Math.exp(-1 / timeConstant);

  let value = 0;
  for (const day of sorted) {
    value = value + (day.tss - value) * decay;
  }

  return Math.round(value * 10) / 10;
}

// CTL : Chronic Training Load (fitness) — constante de temps 42 jours
export function calculateCTL(dailyTSS: DailyTSS[]): number {
  return ewma(dailyTSS, 42);
}

// ATL : Acute Training Load (fatigue) — constante de temps 7 jours
export function calculateATL(dailyTSS: DailyTSS[]): number {
  return ewma(dailyTSS, 7);
}

// TSB : Training Stress Balance (forme) = CTL - ATL
export function calculateTSB(ctl: number, atl: number): number {
  return Math.round((ctl - atl) * 10) / 10;
}

// Convertir les activités en TSS quotidien (agrégé par jour)
export function activitiesToDailyTSS(
  activities: StravaActivity[],
  ftp: number | null,
  lthrBike: number | null,
  lthrRun: number | null
): DailyTSS[] {
  const dailyMap = new Map<string, number>();

  for (const activity of activities) {
    const date = activity.start_date.substring(0, 10); // YYYY-MM-DD
    const tss = estimateTSS(activity, ftp, lthrBike, lthrRun);
    dailyMap.set(date, (dailyMap.get(date) || 0) + tss);
  }

  // Remplir les jours sans activité avec TSS = 0
  const dates = Array.from(dailyMap.keys()).sort();
  if (dates.length === 0) return [];

  const result: DailyTSS[] = [];
  const start = new Date(dates[0]);
  const end = new Date(dates[dates.length - 1]);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().substring(0, 10);
    result.push({ date: dateStr, tss: dailyMap.get(dateStr) || 0 });
  }

  return result;
}

// =============================================================================
// ESTIMATION DES SEUILS
// =============================================================================

// FTP (Functional Threshold Power) : meilleure puissance 20min * 0.95
export function estimateFTP(activities: StravaActivity[]): number | null {
  const rides = activities.filter(
    (a) =>
      (a.type?.includes('Ride') || a.sport_type?.includes('Ride')) &&
      a.weighted_average_watts &&
      a.weighted_average_watts > 0 &&
      a.moving_time >= 1200 // Au moins 20 minutes
  );

  if (rides.length === 0) return null;

  // Prendre la meilleure NP pour les sorties de 20-90 minutes
  const candidates = rides
    .filter((r) => r.moving_time >= 1200 && r.moving_time <= 5400)
    .map((r) => r.weighted_average_watts!)
    .sort((a, b) => b - a);

  if (candidates.length === 0) return null;

  // FTP ≈ meilleure NP 20min * 0.95
  return Math.round(candidates[0] * 0.95);
}

// LTHR (Lactate Threshold Heart Rate)
export function estimateLTHR(activities: StravaActivity[]): { bike: number | null; run: number | null } {
  const estimateForType = (typeFilter: (a: StravaActivity) => boolean): number | null => {
    const candidates = activities
      .filter(
        (a) =>
          typeFilter(a) &&
          a.average_heartrate &&
          a.average_heartrate > 0 &&
          a.moving_time >= 1800 && // Au moins 30 minutes
          a.moving_time <= 5400    // Max 90 minutes (efforts soutenus)
      )
      .sort((a, b) => (b.average_heartrate || 0) - (a.average_heartrate || 0));

    if (candidates.length < 3) return null;

    // Moyenne des 3 meilleures FC moyennes sur efforts soutenus
    const top3 = candidates.slice(0, 3);
    const avg = top3.reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / top3.length;
    return Math.round(avg);
  };

  return {
    bike: estimateForType((a) => a.type?.includes('Ride') || a.sport_type?.includes('Ride')),
    run: estimateForType((a) => a.type === 'Run' || a.sport_type?.includes('Run')),
  };
}

// Max HR observé
export function estimateMaxHR(activities: StravaActivity[]): number | null {
  const maxHRs = activities
    .filter((a) => a.max_heartrate && a.max_heartrate > 100)
    .map((a) => a.max_heartrate!);

  if (maxHRs.length === 0) return null;
  return Math.max(...maxHRs);
}

// Allure seuil course (sec/km)
export function estimateThresholdPace(activities: StravaActivity[]): number | null {
  const runs = activities.filter(
    (a) =>
      (a.type === 'Run' || a.sport_type?.includes('Run')) &&
      a.average_speed > 0 &&
      a.distance >= 5000 &&     // Au moins 5km
      a.moving_time >= 1200 &&  // Au moins 20 minutes
      a.moving_time <= 5400     // Max 90 minutes
  );

  if (runs.length < 3) return null;

  // Trier par vitesse décroissante, prendre les 3 meilleures
  const sorted = runs.sort((a, b) => b.average_speed - a.average_speed);
  const top3 = sorted.slice(0, 3);
  const avgSpeed = top3.reduce((sum, a) => sum + a.average_speed, 0) / top3.length; // m/s

  // Convertir en sec/km
  return Math.round(1000 / avgSpeed);
}

// CSS (Critical Swim Speed) en sec/100m
export function estimateCSS(activities: StravaActivity[]): number | null {
  const swims = activities.filter(
    (a) =>
      (a.type === 'Swim' || a.sport_type?.includes('Swim')) &&
      a.average_speed > 0 &&
      a.distance >= 400 // Au moins 400m
  );

  if (swims.length < 2) return null;

  // Trier par vitesse décroissante, prendre les 3 meilleures
  const sorted = swims.sort((a, b) => b.average_speed - a.average_speed);
  const top = sorted.slice(0, Math.min(3, sorted.length));
  const avgSpeed = top.reduce((sum, a) => sum + a.average_speed, 0) / top.length; // m/s

  // Convertir en sec/100m
  return Math.round(100 / avgSpeed);
}

// =============================================================================
// ZONES D'ENTRAÎNEMENT
// =============================================================================

// Zones FC (modèle 5 zones basé sur % FC max)
export function calculateHRZones(maxHR: number): Zones {
  return {
    z1: { min: Math.round(maxHR * 0.50), max: Math.round(maxHR * 0.60) }, // Récupération
    z2: { min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70) }, // Endurance
    z3: { min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80) }, // Tempo
    z4: { min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90) }, // Seuil
    z5: { min: Math.round(maxHR * 0.90), max: maxHR },                     // VO2 Max
  };
}

// Zones puissance (modèle Coggan 6 zones basé sur % FTP)
export function calculatePowerZones(ftp: number): PowerZones {
  return {
    z1: { min: 0, max: Math.round(ftp * 0.55) },             // Récupération Active
    z2: { min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) }, // Endurance
    z3: { min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) }, // Tempo
    z4: { min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) }, // Seuil
    z5: { min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) }, // VO2 Max
    z6: { min: Math.round(ftp * 1.21), max: Math.round(ftp * 2.00) }, // Anaérobie
  };
}

// Zones allure course (basé sur allure seuil en sec/km)
export function calculatePaceZones(thresholdPace: number): Zones {
  return {
    z1: { min: Math.round(thresholdPace * 1.30), max: Math.round(thresholdPace * 1.50) }, // Récup (plus lent)
    z2: { min: Math.round(thresholdPace * 1.15), max: Math.round(thresholdPace * 1.29) }, // Endurance
    z3: { min: Math.round(thresholdPace * 1.06), max: Math.round(thresholdPace * 1.14) }, // Tempo
    z4: { min: Math.round(thresholdPace * 0.97), max: Math.round(thresholdPace * 1.05) }, // Seuil
    z5: { min: Math.round(thresholdPace * 0.85), max: Math.round(thresholdPace * 0.96) }, // VO2 Max (plus rapide)
  };
}

// =============================================================================
// DISTRIBUTION PAR ZONE
// =============================================================================

function getZoneIndex(value: number, zones: Zones | PowerZones): number {
  const zoneEntries = Object.values(zones) as ZoneRange[];
  for (let i = 0; i < zoneEntries.length; i++) {
    if (value <= zoneEntries[i].max) return i;
  }
  return zoneEntries.length - 1;
}

// Distribution du temps par zone FC (en pourcentages)
export function calculateHRZoneDistribution(
  activities: StravaActivity[],
  zones: Zones
): number[] {
  const zoneTimes = [0, 0, 0, 0, 0]; // z1-z5
  let totalTime = 0;

  for (const a of activities) {
    if (!a.average_heartrate || a.average_heartrate <= 0) continue;
    const idx = getZoneIndex(a.average_heartrate, zones);
    zoneTimes[idx] += a.moving_time;
    totalTime += a.moving_time;
  }

  if (totalTime === 0) return [0, 0, 0, 0, 0];
  return zoneTimes.map((t) => Math.round((t / totalTime) * 100));
}

// Distribution du temps par zone puissance
export function calculatePowerZoneDistribution(
  activities: StravaActivity[],
  zones: PowerZones
): number[] {
  const zoneTimes = [0, 0, 0, 0, 0, 0]; // z1-z6
  let totalTime = 0;

  for (const a of activities) {
    if (!a.average_watts || a.average_watts <= 0) continue;
    if (!a.type?.includes('Ride') && !a.sport_type?.includes('Ride')) continue;
    const idx = getZoneIndex(a.average_watts, zones);
    zoneTimes[idx] += a.moving_time;
    totalTime += a.moving_time;
  }

  if (totalTime === 0) return [0, 0, 0, 0, 0, 0];
  return zoneTimes.map((t) => Math.round((t / totalTime) * 100));
}

// =============================================================================
// VOLUME HEBDOMADAIRE PAR DISCIPLINE
// =============================================================================

export function weeklyVolumeByDiscipline(
  activities: StravaActivity[],
  weeks: number = 4
): { swim: number; bike: number; run: number } {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  const cutoffStr = cutoff.toISOString();

  const recent = activities.filter((a) => a.start_date >= cutoffStr);

  let swimMin = 0;
  let bikeMin = 0;
  let runMin = 0;

  for (const a of recent) {
    const minutes = a.moving_time / 60;
    if (a.type === 'Swim' || a.sport_type?.includes('Swim')) {
      swimMin += minutes;
    } else if (a.type?.includes('Ride') || a.sport_type?.includes('Ride')) {
      bikeMin += minutes;
    } else if (a.type === 'Run' || a.sport_type?.includes('Run')) {
      runMin += minutes;
    }
  }

  return {
    swim: Math.round(swimMin / weeks),
    bike: Math.round(bikeMin / weeks),
    run: Math.round(runMin / weeks),
  };
}

// =============================================================================
// IDENTIFICATION FORCES / FAIBLESSES
// =============================================================================

export function identifyStrengthsWeaknesses(
  weeklyVolume: { swim: number; bike: number; run: number },
  hrDistribution: number[],
  activities: StravaActivity[]
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const { swim, bike, run } = weeklyVolume;
  const totalMin = swim + bike + run;

  // Volume par discipline
  if (totalMin === 0) {
    weaknesses.push('Pas assez de données pour évaluer');
    return { strengths, weaknesses };
  }

  // Identifier la discipline dominante
  const disciplines = [
    { name: 'Natation', min: swim },
    { name: 'Vélo', min: bike },
    { name: 'Course', min: run },
  ].sort((a, b) => b.min - a.min);

  if (disciplines[0].min > 0) {
    strengths.push(`Volume fort en ${disciplines[0].name}`);
  }
  if (disciplines[2].min === 0) {
    weaknesses.push(`${disciplines[2].name} absente de l'entraînement`);
  } else if (disciplines[2].min < totalMin * 0.15) {
    weaknesses.push(`${disciplines[2].name} sous-représentée`);
  }

  // Distribution d'intensité (80/20 rule)
  if (hrDistribution.length >= 5) {
    const lowIntensity = hrDistribution[0] + hrDistribution[1]; // Z1 + Z2
    const highIntensity = hrDistribution[3] + hrDistribution[4]; // Z4 + Z5

    if (lowIntensity >= 75) {
      strengths.push('Bonne polarisation de l\'entraînement');
    }
    if (hrDistribution[2] > 25) {
      weaknesses.push('Trop de temps en Zone 3 (zone grise)');
    }
    if (lowIntensity < 60) {
      weaknesses.push('Pas assez de base aérobie (Z1-Z2)');
    }
    if (highIntensity < 10 && totalMin > 300) {
      weaknesses.push('Manque d\'intensité haute (Z4-Z5)');
    }
  }

  // Régularité
  const recentWeeks = 4;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recentWeeks * 7);
  const recentActivities = activities.filter((a) => a.start_date >= cutoff.toISOString());
  const avgPerWeek = recentActivities.length / recentWeeks;

  if (avgPerWeek >= 5) {
    strengths.push('Excellente régularité d\'entraînement');
  } else if (avgPerWeek >= 3) {
    strengths.push('Bonne régularité d\'entraînement');
  } else if (avgPerWeek < 2) {
    weaknesses.push('Entraînement irrégulier');
  }

  return { strengths, weaknesses };
}
