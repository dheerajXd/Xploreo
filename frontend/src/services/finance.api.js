// GET /finance/summary — live money roll-up (superadmin: all cities, NTA: own region).
import { apiRequest } from './api.js';

export function getFinanceSummary() {
  return apiRequest('/finance/summary');
}
