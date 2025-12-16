import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { FeatureKey } from '@/context/FeatureFlagContext';

type TrackingTile = {
  id: FeatureKey;
  labelKey: string;
  sublabelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  colorKey: 'accent' | 'info' | 'lavender' | 'mint' | 'secondary' | 'primary';
  fullWidth?: boolean;
};

export const TRACKING_TILES: readonly TrackingTile[] = [
  // Top row (Secondary items)
  {
    id: 'health',
    labelKey: 'tracking.tiles.health.label',
    sublabelKey: 'tracking.tiles.health.sublabel',
    icon: 'stethoscope',
    colorKey: 'mint',
  },
  {
    id: 'habit',
    labelKey: 'tracking.tiles.habit.label',
    sublabelKey: 'tracking.tiles.habit.sublabel',
    icon: 'toothbrush-paste',
    colorKey: 'lavender',
  },
  {
    id: 'pumping',
    labelKey: 'tracking.tiles.pumping.label',
    sublabelKey: 'tracking.tiles.pumping.sublabel',
    icon: 'bottle-tonic-outline',
    colorKey: 'accent',
  },

  {
    id: 'sleep',
    labelKey: 'tracking.tiles.sleep.label',
    sublabelKey: 'tracking.tiles.sleep.sublabel',
    icon: 'sleep',
    colorKey: 'lavender',
  },
  // Bottom rows (Primary items - Full Width)
  {
    id: 'diaper',
    labelKey: 'tracking.tiles.diaper.label',
    sublabelKey: 'tracking.tiles.diaper.sublabel',
    icon: 'baby-face-outline',
    colorKey: 'info',
  },
  {
    id: 'feeding',
    labelKey: 'tracking.tiles.feeding.label',
    sublabelKey: 'tracking.tiles.feeding.sublabel',
    icon: 'baby-bottle-outline',
    colorKey: 'accent',
  },
];
