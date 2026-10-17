// Indian mobile number: 10 digits starting 6-9, optionally written with +91 / 91 / 0 and spaces or dashes.
export const PHONE_PATTERN = /^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/;

export function normalizePhone(value: string): string {
  return String(value ?? '').replace(/[\s()-]/g, '');
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(value));
}
