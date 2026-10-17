// Taxes & service fees on stays and experiences. The checkout screen uses the same rate, so the
// amount a traveller pays is the amount the booking (and every dashboard) records.
export const TAX_RATE = 0.12;

export function withTaxes(subtotal: number): { subtotal: number; taxesAndFees: number; total: number } {
  const taxesAndFees = Math.round(subtotal * TAX_RATE);
  return { subtotal, taxesAndFees, total: subtotal + taxesAndFees };
}
