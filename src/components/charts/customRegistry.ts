/**
 * customRegistry.ts
 *
 * Maps componentId strings (used in ComponentChart JSON) to actual React components.
 * Each component must accept { data: Record<string, unknown> }.
 * Add an entry here whenever you create a new bespoke chart in src/components/charts/custom/.
 */

import type { ComponentType } from 'react';
import WarrantBox from './custom/WarrantBox';
import PlacementInstability from './custom/PlacementInstability';

export const CUSTOM_CHART_REGISTRY: Record<string, ComponentType<{ data: Record<string, unknown> }>> = {
  WarrantBox,
  PlacementInstability,
};
