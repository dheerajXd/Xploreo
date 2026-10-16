/**
 * Canonical Partner Hotel Catalog for Xploreo Packages (M4 Phase 2).
 * Consumed from central root Database/fixtures/hotels/catalog.json.
 */
import catalog from '@database/fixtures/hotels/catalog.json';

export const MOCK_HOTELS_CATALOG = catalog;

/**
 * Helper to fetch partner hotels filtered by destination.
 */
export function getHotelsByDestination(destination) {
  if (!destination) return [];
  const q = destination.toLowerCase().trim();
  return MOCK_HOTELS_CATALOG.filter((h) => h.destination.toLowerCase() === q);
}

/**
 * Helper to get a hotel by stable ID.
 */
export function getHotelById(id) {
  return MOCK_HOTELS_CATALOG.find((h) => h.id === id || h.hotelId === id);
}
