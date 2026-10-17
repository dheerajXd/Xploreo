import { Trip, TripStatus } from './entities/trip.entity';

const dayOf = (value?: string | null): string | undefined => {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? ''));
  return match?.[1];
};

/** Inclusive [start, end] calendar days (YYYY-MM-DD) a trip occupies, from its itinerary. */
export function tripDateRange(trip: Pick<Trip, 'itinerary'>): { start?: string; end?: string } {
  const day1 = trip.itinerary?.day1;
  const days = trip.itinerary?.days ?? [];
  const candidates = [
    dayOf(day1?.hotel?.checkInDate),
    dayOf(day1?.hotel?.checkOutDate),
    dayOf(day1?.flight?.departureAt),
    dayOf(day1?.transport?.pickupAt),
    ...days.flatMap((d) => (d.experiences ?? []).flatMap((e) => [dayOf(e.startsAt), dayOf(e.endsAt)])),
  ].filter((d): d is string => Boolean(d));
  if (candidates.length === 0) return {};
  const sorted = [...candidates].sort();
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}

export function rangesOverlap(
  a: { start?: string; end?: string },
  b: { start?: string; end?: string },
): boolean {
  if (!a.start || !a.end || !b.start || !b.end) return false;
  return a.start <= b.end && b.start <= a.end;
}

// A guide is "taken" for a date once a trip with them is confirmed or under way.
export const GUIDE_BLOCKING_STATUSES: TripStatus[] = [TripStatus.CONFIRMED, TripStatus.STARTED];

/** Other trips that already hold this guide on dates overlapping `trip`. */
export function findGuideConflicts(trip: Trip, guideId: string, allTrips: Trip[]): Trip[] {
  const range = tripDateRange(trip);
  return allTrips.filter(
    (t) =>
      t.id !== trip.id &&
      t.guideId === guideId &&
      GUIDE_BLOCKING_STATUSES.includes(t.status) &&
      rangesOverlap(range, tripDateRange(t)),
  );
}

// A guide may start a tour this long before it is due to begin.
export const START_WINDOW_HOURS = 3;

const parseMoment = (value?: string | null): number | undefined => {
  if (!value) return undefined;
  const text = String(value);
  const ms = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text);
  return Number.isNaN(ms) ? undefined : ms;
};

/** Moment the tour is due to begin: the earliest dated item of the itinerary (with its time if it has one). */
export function tripStartAt(trip: Pick<Trip, 'itinerary'>): number | undefined {
  const day1 = trip.itinerary?.day1;
  const moments = [
    parseMoment(day1?.transport?.pickupAt),
    parseMoment(day1?.flight?.departureAt),
    parseMoment(day1?.hotel?.checkInDate),
    ...(trip.itinerary?.days ?? []).flatMap((d) => (d.experiences ?? []).map((e) => parseMoment(e.startsAt))),
  ].filter((m): m is number => m !== undefined);
  return moments.length ? Math.min(...moments) : undefined;
}

/** End of the last itinerary day. */
export function tripEndAt(trip: Pick<Trip, 'itinerary'>): number | undefined {
  const { end } = tripDateRange(trip);
  return end ? Date.parse(`${end}T23:59:59`) : undefined;
}
