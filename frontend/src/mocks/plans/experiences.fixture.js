/**
 * Canonical Curated Experience Catalog for Xploreo Packages (M4 Phase 2).
 * Consumed from central root Database/fixtures/experiences/catalog.json.
 */
import catalog from '@database/fixtures/experiences/catalog.json';

export const MOCK_EXPERIENCES_CATALOG = catalog;

/**
 * Helper to fetch experiences filtered by destination.
 */
export function getExperiencesByDestination(destination) {
  if (!destination) return [];
  const q = destination.toLowerCase().trim();
  return MOCK_EXPERIENCES_CATALOG.filter((e) => e.destination.toLowerCase() === q);
}

/**
 * Helper to get experience by stable ID.
 */
export function getExperienceById(id) {
  return MOCK_EXPERIENCES_CATALOG.find((e) => e.id === id || e.experienceId === id);
}
