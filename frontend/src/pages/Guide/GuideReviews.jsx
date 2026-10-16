import { useMemo } from 'react';
import { useAuth } from '@/foundation';
import { useAsyncData } from '@/hooks/useAsyncData.js';
import { listReviews } from '@/services/schedule.api.js';
import './guideReviews.css';

function Stars({ rating, size = 'gd-star-icon' }) {
  const rounded = Math.round(rating);
  return [1, 2, 3, 4, 5].map((n) => (
    <span key={n} className={`${size} ${n <= rounded ? 'gd-star-filled' : 'gd-star-empty'}`} aria-hidden="true">★</span>
  ));
}

export default function GuideReviews() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsyncData(listReviews);
  // The server returns what this guide may see; keeping only reviews about this guide is a courtesy filter.
  const reviews = useMemo(
    () =>
      (data ?? [])
        .filter((r) => r.targetType === 'guide' && String(r.targetId) === String(user.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [data, user.id],
  );

  const totalCount = reviews.length;
  const avgRating = totalCount > 0 ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / totalCount).toFixed(1) : '0.0';

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(Number(r.rating) || 0);
      if (counts[star] !== undefined) counts[star]++;
    });
    return counts;
  }, [reviews]);

  return (
    <div className="gd-page-wrapper">
      <main className="gd-page">
        <header className="gd-header">
          <div className="gd-header-text">
            <span className="gd-eyebrow">Guide Reviews &amp; Feedback</span>
            <h1 className="gd-title">Reviews &amp; Ratings</h1>
            <p className="gd-subtitle">What travellers are saying about your tours.</p>
          </div>
        </header>

        {!loading && !error && totalCount > 0 ? (
          <section className="gd-review-summary-card" aria-label="Rating Overview">
            <div className="gd-summary-score-col">
              <span className="gd-summary-score-label">Overall Rating</span>
              <div className="gd-summary-score-row">
                <span className="gd-summary-score-num">{avgRating}</span>
                <span className="gd-summary-score-max">/ 5.0</span>
              </div>
              <div className="gd-summary-stars-row" aria-label={`Average rating ${avgRating} out of 5 stars`}>
                <Stars rating={Number(avgRating)} />
              </div>
              <p className="gd-summary-review-count">
                Based on <strong>{totalCount}</strong> verified {totalCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            <div className="gd-summary-bars-col">
              <h3 className="gd-summary-bars-title">Rating Distribution</h3>
              <div className="gd-dist-list">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingCounts[stars] || 0;
                  const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  return (
                    <div key={stars} className="gd-dist-row">
                      <span className="gd-dist-label">{stars}★</span>
                      <div className="gd-dist-bar-track">
                        <div className="gd-dist-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="gd-dist-count">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

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
            <h3 className="gd-state-title">Unable to Load Reviews</h3>
            <p className="gd-state-text">{error.message}</p>
            {error.status !== 403 ? <button type="button" className="gd-btn-retry" onClick={reload}>Try Again</button> : null}
          </div>
        ) : null}

        {data && reviews.length === 0 && !error ? (
          <div className="gd-state-empty">
            <div className="gd-state-icon">⭐</div>
            <h3 className="gd-state-title">No Reviews Yet</h3>
            <p className="gd-state-text">Reviews will appear here after travellers complete trips with you.</p>
          </div>
        ) : null}

        {reviews.length > 0 ? (
          <div className="gd-review-grid">
            {reviews.map((r) => {
              const reviewer = r.reviewerName || r.userName || `Traveller #${r.userId}`;
              const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              return (
                <article className="gd-review-card" key={r.id}>
                  <div className="gd-review-card-top">
                    <div className="gd-reviewer">
                      <div className="gd-reviewer-avatar">{String(reviewer)[0].toUpperCase()}</div>
                      <div>
                        <div className="gd-reviewer-name">{reviewer}</div>
                        <div className="gd-reviewer-date">{date}</div>
                      </div>
                    </div>
                    <div className="gd-review-stars"><Stars rating={Number(r.rating) || 0} /></div>
                  </div>
                  <p className="gd-review-comment">{r.comment || ''}</p>
                </article>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
}
