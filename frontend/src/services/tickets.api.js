import { fetchData } from './api.js';
import { MOCK_TICKETS } from '../mocks/tickets/tickets.fixture.js';

/**
 * Backend base URL. Defaults to localhost:3000 if not specified in env.
 */
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * In-memory fallback copy of mock tickets for development / offline mode.
 */
let localMockStore = [...MOCK_TICKETS];

/**
 * Helper to determine if tickets mock mode is enabled.
 * Uses VITE_MOCKS environment variable (e.g. VITE_MOCKS=all or VITE_MOCKS=tickets).
 */
export function isTicketsMockMode() {
  const envMocks =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_MOCKS
      ? import.meta.env.VITE_MOCKS
      : null;
  if (!envMocks) return true;
  return envMocks === 'all' || envMocks.split(',').map((s) => s.trim()).includes('tickets');
}

/**
 * Custom Error class that retains HTTP status and field messages.
 */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Creates a support ticket (Traveller flow).
 * Calls POST /tickets on NestJS backend.
 * 
 * @param {Object} data - { subject, message, category, priority }
 * @param {Object} [session] - Optional user identity { userId, role }
 * @returns {Promise<Object>} Created Ticket
 */
export async function createTicket(data, session = {}) {
  // Validate constraints on client side before network hop
  const subject = String(data.subject || '').trim();
  const message = String(data.message || '').trim();
  const category = data.category ? String(data.category).trim() : undefined;
  const priority = data.priority || undefined;

  if (subject.length < 3 || subject.length > 140) {
    throw new ApiError('Subject must be between 3 and 140 characters.', 400);
  }
  if (message.length < 10 || message.length > 1200) {
    throw new ApiError('Message must be between 10 and 1200 characters.', 400);
  }

  // Build clean DTO payload (extra fields strictly excluded to prevent NestJS 400s)
  const payload = {
    subject,
    message,
    ...(category ? { category } : {}),
    ...(priority ? { priority } : {}),
  };

  // If Mock mode is explicitly toggled on via VITE_MOCKS
  if (isTicketsMockMode()) {
    const mockTicket = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      travellerId: session.userId || 'traveller-default',
      travellerName: session.userId || 'traveller-default',
      subject: payload.subject,
      message: payload.message,
      category: payload.category || 'General',
      priority: payload.priority || 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    localMockStore.unshift(mockTicket);
    return mockTicket;
  }

  const userId = session.userId || session.userid || 'traveller';
  const role = (session.role || 'traveller').toLowerCase();

  try {
    const result = await fetchData(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'x-user-role': role === 'traveller' ? 'TRAVELLER' : role,
        'x-user-id': String(userId),
      },
      body: JSON.stringify(payload),
    });
    return result;
  } catch (err) {
    const status = parseInt(err.message?.match(/status:\s*(\d+)/)?.[1], 10) || 500;
    if (status === 403) {
      throw new ApiError('You do not have permission to create support tickets.', 403);
    }
    if (status === 400) {
      throw new ApiError('Invalid ticket data provided. Please verify all fields.', 400);
    }
    throw new ApiError(err.message || 'Failed to submit support ticket.', status);
  }
}

/**
 * Retrieves all support tickets (TechAdmin flow).
 * Calls GET /tickets on NestJS backend.
 * 
 * @param {Object} [session] - Optional user identity { userId, role }
 * @returns {Promise<Array>} List of Tickets
 */
export async function getTickets(session = {}) {
  if (isTicketsMockMode()) {
    return [...localMockStore];
  }

  const userId = session.userId || session.userid || 'techadmin';
  const role = (session.role || 'techadmin').toLowerCase();

  try {
    const tickets = await fetchData(`${BASE_URL}/tickets`, {
      method: 'GET',
      headers: {
        'x-user-role': role === 'techadmin' ? 'techadmin' : role,
        'x-user-id': String(userId),
      },
    });
    return tickets;
  } catch (err) {
    const status = parseInt(err.message?.match(/status:\s*(\d+)/)?.[1], 10) || 500;
    if (status === 403) {
      throw new ApiError('Access denied. Only Technical Admins can view all tickets.', 403);
    }
    throw new ApiError(err.message || 'Failed to load support tickets.', status);
  }
}

/**
 * Resolves a support ticket (TechAdmin flow).
 * Calls PATCH /tickets/:id on NestJS backend.
 * 
 * @param {string} ticketId - ID of ticket to resolve
 * @param {string} [resolution] - Resolution details text
 * @param {Object} [session] - Optional user identity { userId, role }
 * @returns {Promise<Object>} Updated Ticket
 */
export async function resolveTicket(ticketId, resolution = '', session = {}) {
  if (!ticketId) {
    throw new ApiError('Ticket ID is required for resolution.', 400);
  }

  const cleanResolution = String(resolution || '').trim();
  if (cleanResolution.length > 800) {
    throw new ApiError('Resolution text must not exceed 800 characters.', 400);
  }

  const payload = cleanResolution ? { resolution: cleanResolution } : {};

  if (isTicketsMockMode()) {
    const idx = localMockStore.findIndex((t) => t.id === ticketId);
    if (idx === -1) {
      throw new ApiError(`Ticket ${ticketId} not found.`, 404);
    }
    if (localMockStore[idx].status === 'RESOLVED') {
      throw new ApiError('Ticket is already resolved.', 400);
    }
    const resolvedTicket = {
      ...localMockStore[idx],
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolvedBy: session.userId || 'techadmin',
      resolution: cleanResolution || 'Resolved by technical admin',
    };
    localMockStore[idx] = resolvedTicket;
    return resolvedTicket;
  }

  const userId = session.userId || session.userid || 'techadmin';
  const role = (session.role || 'techadmin').toLowerCase();

  try {
    const updated = await fetchData(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'PATCH',
      headers: {
        'x-user-role': role === 'techadmin' ? 'techadmin' : role,
        'x-user-id': String(userId),
      },
      body: JSON.stringify(payload),
    });
    return updated;
  } catch (err) {
    const status = parseInt(err.message?.match(/status:\s*(\d+)/)?.[1], 10) || 500;
    if (status === 400) {
      throw new ApiError('Ticket is already resolved or invalid payload sent.', 400);
    }
    if (status === 403) {
      throw new ApiError('Access denied. Only Technical Admins can resolve tickets.', 403);
    }
    if (status === 404) {
      throw new ApiError(`Ticket ${ticketId} not found on server.`, 404);
    }
    throw new ApiError(err.message || 'Failed to resolve ticket.', status);
  }
}

/**
 * Resets the in-memory mock tickets store to the original fixtures.
 * Useful for demo resets and isolated preview harnesses.
 */
export function resetTicketsMockStore() {
  localMockStore = [...MOCK_TICKETS];
  return [...localMockStore];
}

