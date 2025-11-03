/**
 * Global application state store using Nano Stores
 *
 * This store manages shared state across React components (Astro islands):
 * - User session state
 * - Graph panel visibility
 */

import { atom } from 'nanostores';

/**
 * Temporary user type for layout purposes
 * Will be replaced with proper auth implementation later
 */
export interface User {
  email?: string;
  id: string;
}

/**
 * Current authenticated user state
 * Initialized from Layout.astro - currently uses mock data
 * TODO: Replace with actual auth implementation
 */
export const $user = atom<User | null>(null);

/**
 * Graph panel visibility state
 * Controls whether the thought graph sidebar is visible
 */
export const $isGraphPanelVisible = atom<boolean>(false);

/**
 * Helper function to toggle graph panel visibility
 */
export function toggleGraphPanel() {
  $isGraphPanelVisible.set(!$isGraphPanelVisible.get());
}
