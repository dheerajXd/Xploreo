import { fetchData } from './api.js';
import { identityHeaders } from './session.js';

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ||
  'http://localhost:3000/api';

export class TechAdminApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'TechAdminApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Eligible partner/user roles for TechAdmin view & management
 */
export const ELIGIBLE_ROLES = ['traveller', 'guide', 'hotel', 'experience'];

/**
 * Fetch registered users and partners eligible for TechAdmin management.
 * Excludes SuperAdmin and TechAdmin accounts from actionable partner/user lists if desired,
 * or marks them as non-actionable.
 *
 * @param {string} [roleFilter] - 'all' or one of ELIGIBLE_ROLES
 * @returns {Promise<Array>} List of user objects
 */
export async function getTechAdminUsers(roleFilter = 'all') {
  try {
    const headers = identityHeaders();
    const users = await fetchData(`${BASE_URL}/auth/users`, { headers });
    if (!Array.isArray(users)) return [];

    const mapped = users
      .filter((u) => {
        // Only return eligible actor roles
        return ELIGIBLE_ROLES.includes(u.role);
      })
      .map((u) => {
        const resolvedLocation =
          (typeof u.location === 'string' && u.location.trim()) ||
          (typeof u.region === 'string' && u.region.trim()) ||
          (typeof u.city === 'string' && u.city.trim()) ||
          (typeof u.businessLocation === 'string' && u.businessLocation.trim()) ||
          (u.role === 'guide' ? 'Regional Guide' : 'India');

        return {
          userId: u.userId || u.id,
          username: u.username,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          status: u.status || 'active',
          location: resolvedLocation,
          region: u.region || resolvedLocation,
          suspensionReason: u.suspensionReason || null,
          suspendedAt: u.suspendedAt || null,
          suspendedBy: u.suspendedBy || null,
        };
      });

    if (roleFilter && roleFilter !== 'all') {
      return mapped.filter((u) => u.role === roleFilter);
    }
    return mapped;
  } catch (err) {
    const status = parseInt(err.message?.match(/status:\s*(\d+)/)?.[1], 10) || 500;
    throw new TechAdminApiError(err.message || 'Failed to load users and partners.', status);
  }
}

/**
 * Suspend an eligible account.
 * Requires a non-empty suspension reason.
 *
 * @param {string} userId - Target user ID
 * @param {string} reason - Suspension reason (mandatory)
 * @returns {Promise<Object>} Updated user record
 */
export async function suspendUserAccount(userId, reason) {
  if (!userId) throw new TechAdminApiError('User ID is required.', 400);
  const trimmedReason = (reason || '').trim();
  if (!trimmedReason) {
    throw new TechAdminApiError('A non-empty suspension reason is required.', 400);
  }

  try {
    const headers = identityHeaders();
    const updated = await fetchData(`${BASE_URL}/auth/users/${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'inactive',
        suspensionReason: trimmedReason,
        reason: trimmedReason,
      }),
    });
    return updated;
  } catch (err) {
    const status = parseInt(err.message?.match(/status:\s*(\d+)/)?.[1], 10) || 500;
    throw new TechAdminApiError(err.message || 'Failed to suspend account.', status);
  }
}

/**
 * Reactivate a suspended account.
 *
 * @param {string} userId - Target user ID
 * @returns {Promise<Object>} Updated user record
 */
export async function reactivateUserAccount(userId) {
  if (!userId) throw new TechAdminApiError('User ID is required.', 400);

  try {
    const headers = identityHeaders();
    const updated = await fetchData(`${BASE_URL}/auth/users/${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'active',
      }),
    });
    return updated;
  } catch (err) {
    const status = parseInt(err.message?.match(/status:\s*(\d+)/)?.[1], 10) || 500;
    throw new TechAdminApiError(err.message || 'Failed to reactivate account.', status);
  }
}
