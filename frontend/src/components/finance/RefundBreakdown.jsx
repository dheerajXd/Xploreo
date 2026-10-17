import './refundBreakdown.css';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Refund Breakdown panel shared by the Experience and Guide earnings pages.
 * Everything shown is passed in from server data; nothing is calculated against a made-up benchmark.
 *
 * @param {number} refundedAmount  total money refunded in the period
 * @param {number} refundPercent   refunded money as a % of gross revenue
 * @param {number} refundedCount   how many bookings/trips were refunded
 * @param {number} totalCount      all bookings/trips in the period
 */
export default function RefundBreakdown({ refundedAmount = 0, refundPercent = 0, refundedCount = 0, totalCount = 0 }) {
  const rate = totalCount ? Math.round((refundedCount / totalCount) * 100) : 0;
  const tone = refundPercent >= 15 ? 'high' : refundPercent > 0 ? 'some' : 'none';
  return (
    <section className="rb-panel" aria-label="Refund breakdown">
      <h3>Refund Breakdown</h3>
      <div className="rb-amount-row">
        <div>
          <span className="rb-label">Total Refunded</span>
          <strong className="rb-amount">{inr(refundedAmount)}</strong>
        </div>
        <span className={`rb-badge ${tone}`}>{refundPercent}% of revenue</span>
      </div>
      <div className="rb-track" aria-hidden="true">
        <div className={`rb-fill ${tone}`} style={{ width: `${Math.min(100, refundPercent)}%` }} />
      </div>
      <div className="rb-rate-row">
        <span>Refunded bookings</span>
        <strong>{refundedCount} of {totalCount} ({rate}%)</strong>
      </div>
      <p className={`rb-note ${tone}`}>
        {tone === 'none'
          ? 'No refunds in this period.'
          : tone === 'some'
            ? 'Refunds are within a normal range.'
            : 'Refunds are high this period — review recent cancellations.'}
      </p>
    </section>
  );
}
