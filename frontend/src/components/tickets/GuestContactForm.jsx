import { useState } from 'react';
import { createGuestTicket } from '../../services/tickets.api.js';
import './tickets.css';

/**
 * Public "contact support" form for a signed-out visitor — most notably someone whose account
 * was restricted and so is blocked before any session is ever issued, meaning they can never
 * reach the normal, signed-in ticket desk (TicketCreateForm). Same split-card layout and classes
 * as TicketCreateForm so it reads as the same support desk, not a separate, lesser one; it just
 * also collects a name and email so the operations desk has someone to reply to.
 */
export default function GuestContactForm({ onSubmitSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successTicket, setSuccessTicket] = useState(null);

  const errors = {};
  if (touched.name || isSubmitting) {
    if (!name.trim()) errors.name = 'Your name is required.';
    else if (name.trim().length < 2) errors.name = 'Please enter your full name.';
  }
  if (touched.email || isSubmitting) {
    if (!email.trim()) errors.email = 'Your email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Please enter a valid email address.';
  }
  if (touched.subject || isSubmitting) {
    const trimmed = subject.trim();
    if (!trimmed) errors.subject = 'Subject is required.';
    else if (trimmed.length < 3) errors.subject = `Subject must be at least 3 characters (current: ${trimmed.length}).`;
    else if (trimmed.length > 140) errors.subject = `Subject cannot exceed 140 characters (current: ${trimmed.length}).`;
  }
  if (touched.message || isSubmitting) {
    const trimmed = message.trim();
    if (!trimmed) errors.message = 'Message is required.';
    else if (trimmed.length < 10) errors.message = `Message must be at least 10 characters (current: ${trimmed.length}).`;
    else if (trimmed.length > 1200) errors.message = `Message cannot exceed 1200 characters (current: ${trimmed.length}).`;
  }

  const handleBlur = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setSuccessTicket(null);
    setTouched({ name: true, email: true, subject: true, message: true });

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const created = await createGuestTicket({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        category: 'Account Access',
      });

      setSuccessTicket(created);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setTouched({});

      if (typeof onSubmitSuccess === 'function') onSubmitSuccess(created);
    } catch (err) {
      setApiError(err.message || 'An unexpected error occurred while submitting your message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-ticket-split-card">
      {/* Left Panel: Brand Navy Context & Support Info */}
      <div className="admin-ticket-info-panel">
        <div className="admin-ticket-info-glow" aria-hidden="true" />

        <div className="admin-ticket-info-content">
          <div className="admin-ticket-eyebrow">
            <span className="admin-ticket-eyebrow-dot" />
            Xploreo Support
          </div>

          <h2 className="admin-ticket-info-title">We're here to help.</h2>

          <p className="admin-ticket-info-desc">
            Can't sign in — including a restricted account — or just have a general question?
            Send us a message and our operations desk will get back to you by email.
          </p>

          <div className="admin-ticket-features">
            <div className="admin-ticket-feature-row">
              <div className="admin-ticket-feature-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="admin-ticket-feature-text">
                <strong>No account needed</strong>
                <span>We'll reply to the email address you give us</span>
              </div>
            </div>

            <div className="admin-ticket-feature-row">
              <div className="admin-ticket-feature-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="admin-ticket-feature-text">
                <strong>Dedicated support</strong>
                <span>Assistance across Jaipur, Goa, Delhi, Mumbai &amp; Kerala</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-ticket-info-footer">
          <span>Xploreo Travel Network</span>
        </div>
      </div>

      {/* Right Panel: White Form Container */}
      <div className="admin-ticket-form-panel">
        <div className="admin-ticket-form-header">
          <h2 className="admin-ticket-form-title">Contact Support</h2>
          <p className="admin-ticket-form-subtitle">
            Already have an Xploreo account? <a href="/Auth/login">Log in</a> to use the full ticket desk instead.
          </p>
        </div>

        {apiError && (
          <div className="admin-ticket-alert-error" role="alert">
            <span>⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        {successTicket && (
          <div className="admin-ticket-alert-success" role="status">
            <span>✅</span>
            <span>
              Message received! We'll reply to {successTicket.contactEmail || email} as soon as possible.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-ticket-form" noValidate>
          <div className="admin-ticket-row-2col">
            <div className="admin-ticket-form-group">
              <label htmlFor="guest-name" className="admin-ticket-label">
                <span>Your Name *</span>
              </label>
              <input
                id="guest-name"
                type="text"
                className={`admin-ticket-input ${errors.name ? 'admin-ticket-input-error' : ''}`}
                placeholder="e.g. Anjali Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                disabled={isSubmitting}
                required
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'guest-name-error' : undefined}
              />
              {errors.name && <p id="guest-name-error" className="admin-ticket-error-text">{errors.name}</p>}
            </div>

            <div className="admin-ticket-form-group">
              <label htmlFor="guest-email" className="admin-ticket-label">
                <span>Your Email *</span>
              </label>
              <input
                id="guest-email"
                type="email"
                className={`admin-ticket-input ${errors.email ? 'admin-ticket-input-error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                disabled={isSubmitting}
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'guest-email-error' : undefined}
              />
              {errors.email && <p id="guest-email-error" className="admin-ticket-error-text">{errors.email}</p>}
            </div>
          </div>

          <div className="admin-ticket-form-group">
            <label htmlFor="guest-subject" className="admin-ticket-label">
              <span>Subject *</span>
              <span className="admin-ticket-char-count">{subject.length}/140</span>
            </label>
            <input
              id="guest-subject"
              type="text"
              className={`admin-ticket-input ${errors.subject ? 'admin-ticket-input-error' : ''}`}
              placeholder="Brief summary (e.g. My account was restricted)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => handleBlur('subject')}
              disabled={isSubmitting}
              maxLength={140}
              required
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? 'guest-subject-error' : undefined}
            />
            {errors.subject && <p id="guest-subject-error" className="admin-ticket-error-text">{errors.subject}</p>}
          </div>

          <div className="admin-ticket-form-group">
            <label htmlFor="guest-message" className="admin-ticket-label">
              <span>Message *</span>
              <span className="admin-ticket-char-count">{message.length}/1200</span>
            </label>
            <textarea
              id="guest-message"
              className={`admin-ticket-textarea ${errors.message ? 'admin-ticket-input-error' : ''}`}
              placeholder="Please provide details — your username, booking reference, and what happened..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onBlur={() => handleBlur('message')}
              disabled={isSubmitting}
              maxLength={1200}
              required
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'guest-message-error' : undefined}
            />
            {errors.message && <p id="guest-message-error" className="admin-ticket-error-text">{errors.message}</p>}
          </div>

          <button type="submit" className="admin-ticket-btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
