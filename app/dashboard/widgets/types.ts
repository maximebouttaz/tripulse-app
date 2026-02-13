import type { AthleteProfile } from '@/lib/types';

export type DashboardProfile = AthleteProfile & {
  athlete_photo?: string;
  athlete_firstname?: string;
};

export interface WidgetProps {
  profile: DashboardProfile | null;
  loading: boolean;
}
