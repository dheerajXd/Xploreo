import { useCallback, useState } from 'react';
import { useAuth } from '@/foundation';
import { useAsyncData } from '@/hooks/useAsyncData.js';
import { listMyAssignments, listMyTrips, listPlans } from '@/services/guide.api.js';
import StatusChip from '@/components/guide/StatusChip.jsx';
import RefundBreakdown from '@/components/finance/RefundBreakdown.jsx';
import './guideEarnings.css';

const FILTERS = [
  ['all', 'All'],
  ['confirmed', 'Confirmed'],
  ['pending_guide_confirm', 'Pending'],
  ['rejected_by_guide', 'Rejected'],
];

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Assignments are Trips (see trips.service.ts#findAssignmentsForGuide): the only figure the
// server actually tracks per trip is totalAmount (and refundAmount once rejected) — there is no
// separate "fee per traveller" field, so the page shows exactly that instead of guessing.
// Experience-session jobs earn the guide fee; trips use the trip amount.
const amountOf = (job) => (job.kind === 'experience' ? Number(job.guideFee) || 0 : Number(job.totalAmount) || 0);
const sum = (jobs) => jobs.reduce((total, job) => total + amountOf(job), 0);
const dateOf = (job) => job.date || job.itinerary?.day1?.hotel?.checkInDate || job.itinerary?.day1?.flight?.departureAt || job.lastUpdatedAt;

export default function GuideEarnings() {
  const { user } = useAuth();
  const loader = useCallback(() => Promise.all([listMyAssignments(user.id), listPlans(), listMyTrips(user.id)]), [user.id]);
  const { data, error, loading, reload } = useAsyncData(loader);
  const [filter, setFilter] = useState('all');
  const [jobs, plans, trips] = data ?? [[], [], []];

  const confirmed = jobs.filter((j) => j.status === 'confirmed' || j.status === 'started' || j.status === 'completed');
  const pending = jobs.filter((j) => j.status === 'pending_guide_confirm');
  const rows = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);
  // Refunds come from the guide's trips that were refunded or cancelled after being booked.
  const refundedTrips = trips.filter((t) => t.status === 'refunded' || t.status === 'cancelled');
  const refundedAmount = sum(refundedTrips);
  const grossAmount = sum(confirmed) + refundedAmount;
  const refundPercent = grossAmount ? Math.round((refundedAmount / grossAmount) * 100) : 0;
  const planOf = (id) => plans.find((p) => String(p.id) === String(id));

  return (
    <div className="gd-page-wrapper">
      <main className="gd-page">
        <header className="gd-header">
          <div className="gd-header-text">
            <span className="gd-eyebrow">Guide Portal</span>
            <h1 className="gd-title">Earnings</h1>
            <p className="gd-subtitle">Your trip-by-trip income overview.</p>
          </div>
        </header>

        <section className="gd-kpi-row" aria-label="Earnings Overview">
          <div className="gd-kpi-card">
            <div className="gd-kpi-icon-wrap kpi-teal">₹</div>
            <div className="gd-kpi-data"><span className="gd-kpi-val">{inr(sum(confirmed))}</span><span className="gd-kpi-lbl">Total Earned</span></div>
          </div>
          <div className="gd-kpi-card">
            <div className="gd-kpi-icon-wrap kpi-yellow">⏳</div>
            <div className="gd-kpi-data"><span className="gd-kpi-val">{inr(sum(pending))}</span><span className="gd-kpi-lbl">Pending Payout</span></div>
          </div>
          <div className="gd-kpi-card">
            <div className="gd-kpi-icon-wrap kpi-green">✓</div>
            <div className="gd-kpi-data"><span className="gd-kpi-val">{confirmed.length}</span><span className="gd-kpi-lbl">Confirmed Trips</span></div>
          </div>
          <div className="gd-kpi-card">
            <div className="gd-kpi-icon-wrap kpi-blue">📋</div>
            <div className="gd-kpi-data"><span className="gd-kpi-val">{jobs.length}</span><span className="gd-kpi-lbl">Total Jobs</span></div>
          </div>
        </section>

        {data ? (
          <RefundBreakdown
            refundedAmount={refundedAmount}
            refundPercent={refundPercent}
            refundedCount={refundedTrips.length}
            totalCount={trips.length}
          />
        ) : null}

        <section className="gd-section-header">
          <h2>Trip Earnings Breakdown</h2>
          <div className="gd-filter-row">
            {FILTERS.map(([key, label]) => (
              <button key={key} type="button" className={`gd-filter-btn${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>
        </section>

        {!data && loading ? (
          <div className="gd-review-loading" aria-hidden="true">
            <div className="gd-review-skeleton-card" />
            <div className="gd-review-skeleton-card" />
            <div className="gd-review-skeleton-card" />
          </div>
        ) : null}

        {error ? (
          <div className="gd-state-error" role="alert">
            <div className="gd-state-icon">⚠️</div>
            <h3 className="gd-state-title">{error.status === 403 ? 'Not permitted' : 'Something went wrong'}</h3>
            <p className="gd-state-text">{error.message}</p>
            {error.status !== 403 ? <button type="button" className="gd-btn-retry" onClick={reload}>Try Again</button> : null}
          </div>
        ) : null}

        {data ? (
          <div className="gd-trip-list">
            {rows.length === 0 ? <div className="gd-empty">No trips found for this filter.</div> : null}
            {rows.map((job) => {
              const plan = planOf(job.planId);
              const earned = job.status === 'confirmed' || job.status === 'started' || job.status === 'completed';
              return (
                <article className={`gd-trip-card${earned ? ' is-earned' : ''}`} key={job.id}>
                  <div className="gd-trip-left">
                    <span className="gd-trip-dest">{job.kind === 'experience' ? job.destination : plan?.destination || 'Trip'}</span>
                    <h3 className="gd-trip-name">{job.kind === 'experience' ? `🎟 ${job.title}` : plan?.title || job.planId}</h3>
                    <div className="gd-trip-meta">
                      <span>📅 {dateOf(job) ? new Date(dateOf(job)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                    </div>
                  </div>
                  <div className="gd-trip-right">
                    <div className="gd-trip-total-block">
                      <span className="gd-trip-total-label">{job.kind === 'experience' ? 'Guide Fee' : 'Trip Amount'}</span>
                      <span className={`gd-trip-total${earned ? ' is-earned' : ''}`}>
                        {inr(amountOf(job))}
                      </span>
                    </div>
                    <StatusChip status={job.status} />
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
}
