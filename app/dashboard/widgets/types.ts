import type { AthleteProfile } from '@/lib/types';

export type DashboardProfile = AthleteProfile & {
  athlete_photo?: string;
  athlete_firstname?: string;
};

export interface WidgetProps {
  profile: DashboardProfile | null;
  loading: boolean;
}

export type IntensityBlock = { zone: string; duration: number };

export type Workout = {
  id: number;
  dateKey: string;
  type: string;
  title: string;
  duration: string;
  durationMin: number;
  tss: number;
  status: 'completed' | 'upcoming' | 'planned';
  details: { warmup: string; main: string; cooldown: string };
  focus: string | null;
  equipment: string[] | null;
  targetZones: string | null;
  coachTip: string | null;
  purpose: string | null;
  nutrition: string | null;
  feelLegs: number;
  feelCardio: number;
  feelMental: number;
  intensityBlocks: IntensityBlock[] | null;
};
