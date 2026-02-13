// --- TYPES PARTAGÉS TRICOACH ---

export interface StravaActivity {
  strava_activity_id: number;
  athlete_id: number;
  name: string;
  type: string;         // 'Ride', 'Run', 'Swim', 'VirtualRide', 'Walk', etc.
  sport_type: string;   // Plus spécifique: 'MountainBikeRide', 'TrailRun', etc.
  distance: number;     // mètres
  moving_time: number;  // secondes
  elapsed_time: number; // secondes
  total_elevation_gain: number;
  average_speed: number;    // m/s
  max_speed: number;        // m/s
  average_heartrate: number | null;
  max_heartrate: number | null;
  average_watts: number | null;
  max_watts: number | null;
  weighted_average_watts: number | null;
  kilojoules: number | null;
  suffer_score: number | null;
  average_cadence: number | null;
  start_date: string;   // ISO
  raw_data: any;
}

export interface ZoneRange {
  min: number;
  max: number;
}

export interface Zones {
  z1: ZoneRange;
  z2: ZoneRange;
  z3: ZoneRange;
  z4: ZoneRange;
  z5: ZoneRange;
}

export interface PowerZones extends Zones {
  z6: ZoneRange; // Neuromuscular (Coggan)
}

export interface DailyTSS {
  date: string; // YYYY-MM-DD
  tss: number;
}

export interface AthleteProfile {
  athlete_id: number;

  // Seuils estimés
  ftp_watts: number | null;
  lthr_bike: number | null;
  lthr_run: number | null;
  threshold_pace_sec: number | null; // sec/km
  max_hr: number | null;
  css_pace_sec: number | null;       // sec/100m

  // Charge d'entraînement
  ctl: number;  // Chronic Training Load (fitness)
  atl: number;  // Acute Training Load (fatigue)
  tsb: number;  // Training Stress Balance (forme)

  // Volume hebdomadaire moyen (minutes)
  weekly_swim_min: number;
  weekly_bike_min: number;
  weekly_run_min: number;

  // Distribution par zone (pourcentages [z1, z2, z3, z4, z5])
  hr_zone_distribution: number[] | null;
  power_zone_distribution: number[] | null;

  // Forces et faiblesses
  strengths: string[];
  weaknesses: string[];
  assessment_summary: string | null;

  last_assessed_at: string | null;
}

export type Discipline = 'swim' | 'bike' | 'run';
