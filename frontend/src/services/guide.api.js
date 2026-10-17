// Domain service for the guide portal, built on the shared request().
// Each function names the real backend endpoint it calls. Bodies carry only the fields the
// backend DTOs list (extra fields are a 400 on the real API).
import { request } from '@/foundation';

const listOf = (response) => (Array.isArray(response) ? response : response?.items ?? response?.data ?? []);
const enc = encodeURIComponent;

// GET /plans   (array or { items })
export async function listPlans() {
  return listOf(await request('/plans'));
}

// GET /guide-applications/guide/:guideId
export async function listMyApplications(guideId) {
  return listOf(await request(`/guide-applications/guide/${enc(guideId)}`));
}

// POST /guide-applications   CreateGuideApplicationDto { planId, guidePricePerPerson }
export function applyToPlan({ planId, guidePricePerPerson }) {
  return request('/guide-applications', { method: 'POST', body: { planId, guidePricePerPerson } });
}

// GET /guide-assignments/guide/:guideId
// Trip assignments plus experience-session jobs (GET /experience-guides/jobs, flagged kind: 'experience').
export async function listMyAssignments(guideId) {
  const [trips, sessions] = await Promise.all([
    request(`/guide-assignments/guide/${enc(guideId)}`),
    request('/experience-guides/jobs').catch(() => []),
  ]);
  return [...listOf(trips), ...listOf(sessions)];
}

// PATCH /guide-assignments/:id/confirm | /reject   (no body)
// Experience jobs live under /experience-guides/:id/confirm|reject.
export function confirmAssignment(id, kind) {
  const base = kind === 'experience' ? '/experience-guides' : '/guide-assignments';
  return request(`${base}/${enc(id)}/confirm`, { method: 'PATCH' });
}
export function rejectAssignment(id, kind) {
  const base = kind === 'experience' ? '/experience-guides' : '/guide-assignments';
  return request(`${base}/${enc(id)}/reject`, { method: 'PATCH' });
}

// GET /traveller/:id   (the real endpoint lets any guide read any traveller; see MERGE_NOTES)
export function getTraveller(userId) {
  return request(`/traveller/${enc(userId)}`);
}

// GET /trips/guide/:guideId
export async function listMyTrips(guideId) {
  return listOf(await request(`/trips/guide/${enc(guideId)}`));
}

// PATCH /trips/:id/tracking   UpdateTripTrackingDto
const TRACKING_FIELDS = ['currentDay', 'currentStop', 'currentLocation', 'trackingStatus', 'progressPercentage'];
export function updateTripTracking(tripId, changes) {
  const body = Object.fromEntries(TRACKING_FIELDS.filter((f) => changes[f] !== undefined).map((f) => [f, changes[f]]));
  return request(`/trips/${enc(tripId)}/tracking`, { method: 'PATCH', body });
}

// GET /tickets (user-scoped by the server)   POST /tickets   CreateTicketDto { subject, message, category?, priority? }
export async function listMyTickets() {
  return listOf(await request('/tickets'));
}
export function createTicket({ subject, message, category }) {
  return request('/tickets', { method: 'POST', body: { subject, message, category } });
}
