// Non-component helpers shared by the hotel portal pages.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData.js';

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const STATUS_LABEL = { CONFIRMED: 'Confirmed', CHECKED_IN: 'Checked In', CHECKED_OUT: 'Checked Out', CANCELLED: 'Cancelled' };
export const STATUS_CLASS = { CONFIRMED: 'confirmed', CHECKED_IN: 'checked-in', CHECKED_OUT: 'completed', CANCELLED: 'cancelled' };

// Loads through `loader` (a stable function) and exposes reload().
export function useHotelData(loader) {
  return useAsyncData(loader);
}

// Small toast: const [toast, notify] = useToast();  notify('Saved') / notify('Failed', true)
export function useToast() {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const notify = useCallback((text, isError = false) => {
    clearTimeout(timer.current);
    setMessage({ text, isError });
    timer.current = setTimeout(() => setMessage(null), 3200);
  }, []);
  const node = message ? (
    <div
      role="status"
      style={{
        position: 'fixed', right: 24, bottom: 24, zIndex: 2000, padding: '12px 18px', borderRadius: 10, color: '#fff',
        fontSize: 14, fontWeight: 500, background: message.isError ? '#dc2626' : '#16a34a', boxShadow: '0 8px 20px rgba(0,0,0,.15)',
      }}
    >
      {message.text}
    </div>
  ) : null;
  return [node, notify];
}
