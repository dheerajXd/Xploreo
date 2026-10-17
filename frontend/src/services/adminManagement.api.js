// Admin Management (Super Admin only): regional (NonTechAdmin) and Tech Admin accounts.
//   GET  /auth/staff                     list regional + tech admin accounts
//   POST /auth/staff                     create one
//   PATCH /auth/users/:id                status / region changes (same endpoint Users & Partners uses)
// Super Admin accounts are never listed, created, or edited here — see backend/src/auth/auth.service.ts.
import { request } from '@/foundation';

const enc = encodeURIComponent;
const listOf = (response) => (Array.isArray(response) ? response : response?.items ?? response?.data ?? []);

export async function listStaff() {
  return listOf(await request('/auth/staff'));
}

export function createStaffAccount({ username, password, name, email, phone, role, region }) {
  return request('/auth/staff', {
    method: 'POST',
    body: { username, password, name, email, phone, role, ...(region ? { region } : {}) },
  });
}

export function setStaffStatus(userId, status) {
  return request(`/auth/users/${enc(userId)}`, { method: 'PATCH', body: { status } });
}

export function setStaffRegion(userId, region) {
  return request(`/auth/users/${enc(userId)}`, { method: 'PATCH', body: { region } });
}
