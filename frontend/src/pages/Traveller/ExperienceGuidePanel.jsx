import { useState } from 'react';
import { GuidePicker } from './TripGuidePanel.jsx';
import {
  cancelExperienceGuide,
  listExperienceGuides,
  requestExperienceGuide,
} from '../../services/tripGuides.api.js';
import { formatCurrency } from '../../utils/checkoutUtils.js';
import './tripGuidePanel.css';

/**
 * "Do you want a guide for this experience?" — shown right after booking and on the booking card.
 *  - no guide yet    -> ask: "Add a guide" / (when `askFirst`) "No thanks"
 *  - requested       -> waiting note + cancel
 *  - confirmed       -> confirmed note with the guide fee
 *  - declined        -> red "guide not confirmed" note + choose another
 * Guides offered are NTA-approved for the experience's region and free on the session date.
 */
export default function ExperienceGuidePanel({ booking: initial, askFirst = false, onChanged }) {
  const [booking, setBooking] = useState(initial);
  const [picking, setPicking] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const status = booking.guideStatus;
  const upcoming = String(booking.date).slice(0, 10) >= new Date().toISOString().slice(0, 10);
  if (booking.status !== 'CONFIRMED' || !upcoming) {
    return booking.guideName && status === 'confirmed' ? (
      <div className="trav-guide-panel">
        <div className="trav-guide-note is-ok">✅ Guide: <strong>{booking.guideName}</strong></div>
        <GuideContactLine guide={booking.guide} />
      </div>
    ) : null;
  }

  async function onCancel() {
    setBusy(true);
    setError('');
    try {
      await apiCancel(booking.id);
      setBooking((prev) => ({ ...prev, guideId: undefined, guideName: undefined, guideStatus: undefined, guideFee: undefined, guidePricePerPerson: undefined }));
      await onChanged?.();
    } catch (err) {
      setError(err.message || 'Could not cancel the request.');
    } finally {
      setBusy(false);
    }
  }

  const noGuide = !status || status === 'declined';
  if (askFirst && noGuide && dismissed && status !== 'declined') return null;

  return (
    <div className="trav-guide-panel" data-testid={`exp-guide-panel-${booking.id}`}>
      {status === 'declined' ? (
        <div className="trav-guide-note is-error" role="alert">
          <strong>Guide not confirmed.</strong> {booking.guideNote || 'Your guide could not take this session.'} Your
          booking is still confirmed — you can choose another guide.
        </div>
      ) : null}
      {status === 'requested' ? (
        <div className="trav-guide-note is-pending">
          ⏳ Waiting for <strong>{booking.guideName}</strong> to confirm
          {booking.guideFee ? <> · guide fee {formatCurrency(booking.guideFee)}</> : null}.
        </div>
      ) : null}
      {status === 'confirmed' ? (
        <>
          <div className="trav-guide-note is-ok">
            ✅ Guide confirmed: <strong>{booking.guideName}</strong>
            {booking.guideFee ? <> · guide fee {formatCurrency(booking.guideFee)}</> : null}
          </div>
          <GuideContactLine guide={booking.guide} />
        </>
      ) : null}
      {noGuide && status !== 'declined' ? (
        <div className="trav-guide-note is-neutral">
          {askFirst ? 'Would you like a local guide for this experience?' : 'No guide added. You can add a local guide for this session.'}
        </div>
      ) : null}
      {error ? <div className="trav-guide-note is-error" role="alert">{error}</div> : null}

      <div className="trav-guide-actions">
        {noGuide ? (
          <button type="button" className="trav-guide-btn is-primary" onClick={() => setPicking(true)}>
            {status === 'declined' ? 'Choose another guide' : askFirst ? 'Yes, add a guide' : 'Add a guide'}
          </button>
        ) : null}
        {noGuide && askFirst && status !== 'declined' ? (
          <button type="button" className="trav-guide-btn" onClick={() => setDismissed(true)}>No thanks</button>
        ) : null}
        {status === 'requested' ? (
          <button type="button" className="trav-guide-btn" disabled={busy} onClick={onCancel}>
            {busy ? 'Cancelling…' : 'Cancel request'}
          </button>
        ) : null}
      </div>

      {picking ? (
        <GuidePicker
          entityId={booking.id}
          list={listExperienceGuides}
          send={requestExperienceGuide}
          feeLabel="Guide fee"
          onClose={() => setPicking(false)}
          onRequested={async (updated) => {
            setPicking(false);
            if (updated) setBooking((prev) => ({ ...prev, ...updated }));
            await onChanged?.();
          }}
        />
      ) : null}
    </div>
  );
}

const apiCancel = (id) => cancelExperienceGuide(id);

// Only rendered once the booking has a confirmed guide — the traveller earned this contact info
// by picking an NTA-approved guide, so the server already attaches it to the booking response.
function GuideContactLine({ guide }) {
  if (!guide) return null;
  return (
    <div className="trav-guide-note is-neutral">
      {guide.phone ? <>📞 {guide.phone}</> : null}
      {guide.phone && guide.email ? ' · ' : null}
      {guide.email ? <>✉️ <a href={`mailto:${guide.email}`}>{guide.email}</a></> : null}
    </div>
  );
}
