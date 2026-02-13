import type { WidgetProps } from './types';

import { HeroWidget, heroClassName } from './HeroWidget';
import { CoachWidget, coachClassName } from './CoachWidget';
import { WeatherWidget, weatherClassName } from './WeatherWidget';
import { ThresholdsWidget, thresholdsClassName } from './ThresholdsWidget';
import { WeaknessesWidget, weaknessesClassName } from './WeaknessesWidget';
import { VolumeWidget, volumeClassName } from './VolumeWidget';
import { TsbWidget, tsbClassName } from './TsbWidget';
import { FitnessWidget, fitnessClassName } from './FitnessWidget';

export type { WidgetProps, DashboardProfile } from './types';

export interface WidgetConfig {
  className: string;
  component: React.FC<WidgetProps>;
}

export const WIDGET_CONFIGS: Record<string, WidgetConfig> = {
  hero: { className: heroClassName, component: HeroWidget },
  coach: { className: coachClassName, component: CoachWidget },
  weather: { className: weatherClassName, component: WeatherWidget as React.FC<WidgetProps> },
  thresholds: { className: thresholdsClassName, component: ThresholdsWidget },
  weaknesses: { className: weaknessesClassName, component: WeaknessesWidget },
  volume: { className: volumeClassName, component: VolumeWidget },
  tsb: { className: tsbClassName, component: TsbWidget },
  fitness: { className: fitnessClassName, component: FitnessWidget },
};

export const DEFAULT_ORDER = ['hero', 'coach', 'weather', 'thresholds', 'weaknesses', 'volume', 'tsb', 'fitness'];
