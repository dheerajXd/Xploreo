import { useCallback, useEffect, useState } from 'react';
import { getFinanceSummary } from '../../services/finance.api.js';
import './liveFinance.css';

const KIND_LABEL = { package: 'Travel packages', hotel: 'Hotel stays', experience: 'Experiences' };
const BUCKET_LABEL = { completed: 'Completed', upcoming: 'Upcoming', refunded: 'Refunded' };
const rupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/**
 * Live money summary for admins: what was earned (service delivered), what is paid but still
 * upcoming, and what was refunded — across packages, hotels and experiences. An NTA only
 * receives their own region from the server; a superadmin also gets the per-city split.
 */
export default function LiveFinancePanel({ showCities = true }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await getFinanceSummary());
    } catch (err) {
      setError(err.message || 'Could not load the finance summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const totals = summary?.totals;
  return (
    <section className="lf-panel" aria-label="Live revenue summary">
      <div className="lf-head">
        <div>
          <h2>Live revenue {summary?.scope && summary.scope !== 'all' ? `· ${summary.scope}` : '· all cities'}</h2>
          <p>Computed from real bookings. Completed = service delivered; Upcoming = paid, not yet delivered.</p>
        </div>
        <button type="button" className="lf-refresh" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {error ? <div className="lf-error" role="alert">{error}</div> : null}

      {totals ? (
        <>
          <div className="lf-kpis">
            <div className="lf-kpi"><span>Total bookings</span><strong>{totals.count}</strong></div>
            <div className="lf-kpi is-good"><span>Completed revenue</span><strong>{rupees(totals.completed)}</strong></div>
            <div className="lf-kpi is-warn"><span>Upcoming (paid)</span><strong>{rupees(totals.upcoming)}</strong></div>
            <div className="lf-kpi is-bad"><span>Refunded</span><strong>{rupees(totals.refunded)}</strong></div>
            <div className="lf-kpi"><span>Net held / earned</span><strong>{rupees(totals.net)}</strong></div>
          </div>

          <div className="lf-grid">
            <div>
              <h3 className="lf-h3">By booking type</h3>
              <FinanceTable rows={summary.byKind.map((r) => ({ key: r.kind, label: KIND_LABEL[r.kind], ...r }))} first="Type" />
            </div>
            {showCities ? (
              <div>
                <h3 className="lf-h3">By city</h3>
                <FinanceTable rows={summary.byCity.map((r) => ({ key: r.city, label: r.city || '—', ...r }))} first="City" />
              </div>
            ) : null}
          </div>

          <h3 className="lf-h3" style={{ marginTop: 18 }}>Recent transactions</h3>
          <div className="lf-table-wrap">
            <table className="lf-table">
              <thead>
                <tr><th>Type</th><th>Item</th><th>City</th><th>Date</th><th>Status</th><th className="num">Amount</th></tr>
              </thead>
              <tbody>
                {summary.transactions.length === 0 ? (
                  <tr><td colSpan={6}>No transactions yet.</td></tr>
                ) : (
                  summary.transactions.map((t) => (
                    <tr key={`${t.kind}-${t.id}`}>
                      <td>{KIND_LABEL[t.kind]}</td>
                      <td>{t.title}</td>
                      <td>{t.city}</td>
                      <td>{String(t.date).slice(0, 10)}</td>
                      <td><span className={`lf-chip ${t.bucket}`}>{BUCKET_LABEL[t.bucket]}</span></td>
                      <td className="num">{rupees(t.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}

function FinanceTable({ rows, first }) {
  return (
    <div className="lf-table-wrap">
      <table className="lf-table">
        <thead>
          <tr><th>{first}</th><th className="num">Bookings</th><th className="num">Completed</th><th className="num">Upcoming</th><th className="num">Refunded</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={5}>No data yet.</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="num">{r.count}</td>
                <td className="num">{rupees(r.completed)}</td>
                <td className="num">{rupees(r.upcoming)}</td>
                <td className="num">{rupees(r.refunded)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
