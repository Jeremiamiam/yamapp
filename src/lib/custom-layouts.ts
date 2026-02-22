import type { ComponentType } from 'react';
import type { LayoutComponentProps } from './section-registry';

import { LayoutProductGrid } from '@/components/layouts/LayoutProductGrid';

import { LayoutProductDetail } from '@/components/layouts/LayoutProductDetail';

import { LayoutFilters } from '@/components/layouts/LayoutFilters';

import { LayoutProjectGrid } from '@/components/layouts/LayoutProjectGrid';

import { LayoutLocationMap } from '@/components/layouts/LayoutLocationMap';

import { LayoutHeroV2 } from '@/components/layouts/LayoutHeroV2';

/** Layouts générés par l'IA — enrichi automatiquement via /api/generate-layout */
export const CUSTOM_LAYOUTS: Record<string, ComponentType<LayoutComponentProps>> = {
  hero_v2: LayoutHeroV2,
  location_map: LayoutLocationMap,
  project_grid: LayoutProjectGrid,
  filters: LayoutFilters,
  product_detail: LayoutProductDetail,
  product_grid: LayoutProductGrid,
};
