import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import {
  BookingSummaryCard,
  CheckoutStepper,
  PaymentMethodSelector,
  TravellerDetailsForm,
  DEFAULT_CHECKOUT_STEPS,
  DEFAULT_PAYMENT_METHODS,
} from '../../components/checkout/index.js';
import { formatCurrency, formatDate, validateBookingDates } from '../../utils/checkoutUtils.js';
import { getPaymentAdapter } from '../../services/paymentService.js';
import { apiRequest, getSavedUser } from '../../services/api.js';
import ExperienceGuidePanel from './ExperienceGuidePanel.jsx';
import './travellerCheckout.css';

const DEFAULT_DEMO_ITEM = {
  id: 'demo-item-taj',
  title: 'Taj Lake Palace - Luxury Heritage Suite',
  type: 'hotel',
  location: 'Lake Pichola, Udaipur, Rajasthan',
  date: '2026-11-10',
  checkIn: '2026-11-10',
  checkOut: '2026-11-14',
  guestCount: 2,
  basePrice: 7500,
  taxesAndFees: 1200,
  imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
};

/**
 * TravellerCheckoutPage
 * End-to-end checkout interface utilizing the explicit Mock Payment Adapter.
 *
 * Rules:
 * - Operates in explicit Demo Mode.
 * - Minimal checkout header with brand logo & secure label (no full navbar).
 * - Two-column desktop layout (booking details + traveller info + payment on left, prominent summary on right).
 * - Does not charge real credit cards or contact Razorpay.
 * - Supports simulated Success, Failure/Decline, and Cancellation outcomes.
 * - Leaves room for a future backend payment adapter to drop in seamlessly.
 */
export default function TravellerCheckoutPage({
  user,
  initialItem = null,
  adapter = null,
  onComplete = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Item to checkout passed via state, prop, or fallback demo item
  const selectedItem = location.state?.item || initialItem || DEFAULT_DEMO_ITEM;

  const paymentAdapter = adapter || getPaymentAdapter({ mode: 'mock' });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Form details collected from Step 1
  const [travellerDetails, setTravellerDetails] = useState({
    firstName: user?.name ? user.name.split(' ')[0] : 'Anjali',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : 'Sharma',
    email: user?.email || 'anjali@xploreo.com',
    phone: user?.phone || '9123456780',
    specialRequests: 'High floor room preferred, quiet corner.',
  });

  // Payment method & simulation outcome
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [simulatedOutcome, setSimulatedOutcome] = useState('SUCCESS'); // 'SUCCESS' | 'FAILURE' | 'CANCEL'

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdExperience, setCreatedExperience] = useState(null);
  const hasPersistedRef = useRef(false);
  const persistenceIdRef = useRef(null);

  // Guest count limits: min 1 (backend validation), max based on capacity/inventory (fallback 10)
  const minGuests = 1;
  const maxGuests = Math.min(
    10,
    Math.max(
      1,
      Number(
        selectedItem.capacity ||
        selectedItem.maxGuests ||
        selectedItem.availableSeats ||
        10
      )
    )
  );

  // Initialize selector from previous screen when available; fallback to 2
  const initialGuestCount = Math.max(
    minGuests,
    Math.min(
      maxGuests,
      Number(
        location.state?.guestCount ??
        location.state?.guests ??
        location.state?.participants ??
        location.state?.item?.guestCount ??
        location.state?.item?.guests ??
        location.state?.item?.participants ??
        initialItem?.guestCount ??
        initialItem?.guests ??
        initialItem?.participants ??
        selectedItem.guestCount ??
        selectedItem.participants ??
        selectedItem.guests ??
        2
      ) || 2
    )
  );

  const [guestCount, setGuestCount] = useState(initialGuestCount);

  const handleGuestChange = (newCount) => {
    const parsed = Number(newCount);
    if (!isNaN(parsed)) {
      setGuestCount(Math.max(minGuests, Math.min(maxGuests, parsed)));
    }
  };

  // Pricing calculations: dynamic base fare and guest-dependent taxes/fees
  const basePrice = Number(
    selectedItem.pricePerNight ?? selectedItem.price ?? selectedItem.basePrice ?? 5000
  );
  const pricingType = (selectedItem.type || selectedItem.bookingType || 'hotel').toLowerCase();
  const isStay = pricingType === 'hotel';
  const isExperience = pricingType === 'experience';
  const TAX_RATE = 0.12; // same rate the server applies, so what is paid is what is recorded
  // A stay is charged per night per room; an experience (and anything else) per guest.
  const stayNights = isStay && selectedItem.checkIn && selectedItem.checkOut
    ? Math.max(1, Math.round((Date.parse(selectedItem.checkOut) - Date.parse(selectedItem.checkIn)) / 86400000))
    : 1;
  const roomCount = Math.max(1, parseInt(location.state?.rooms ?? selectedItem.roomCount ?? 1, 10) || 1);
  const quantity = isStay ? stayNights * roomCount : guestCount;
  const subtotal = basePrice * quantity;
  const stayNightsLabel = `${stayNights} ${stayNights === 1 ? 'night' : 'nights'}`;
  const fareLabel = isStay
    ? `Base Fare (${roomCount} ${roomCount === 1 ? 'room' : 'rooms'} × ${stayNightsLabel} × ${formatCurrency(basePrice)})`
    : null;

  // Hotels and experiences: 12% taxes & fees. Other items keep their own figure (fallback 1200).
  const taxPerGuest = selectedItem.taxPerGuest ?? selectedItem.taxesPerGuest ?? selectedItem.feePerGuest ?? null;
  const taxesAndFees = isStay || isExperience
    ? Math.round(subtotal * TAX_RATE)
    : taxPerGuest != null
      ? Number(taxPerGuest) * guestCount
      : Number(selectedItem.taxesAndFees ?? 1200);

  const totalAmount = subtotal + taxesAndFees;

  const itemType = (selectedItem.type || selectedItem.bookingType || 'hotel').toLowerCase();
  // Single-day things (an experience session) show one date; stays and packages show a range.
  const startDate = selectedItem.checkIn || selectedItem.date;
  const endDate = selectedItem.checkOut;
  const isSingleDay = itemType === 'experience' || !endDate || endDate === startDate;
  const dateError = validateBookingDates({ type: itemType, checkIn: startDate, checkOut: endDate });

  const cardBooking = {
    title: selectedItem.title || selectedItem.name || 'Demo Reservation',
    type: selectedItem.type || selectedItem.bookingType || 'hotel',
    location: selectedItem.location || selectedItem.city || selectedItem.destination || 'India',
    date: !startDate
      ? 'Date not set'
      : isSingleDay
        ? formatDate(startDate)
        : `${formatDate(startDate)} → ${formatDate(endDate)}`,
    guestCount: guestCount,
    roomCount: isStay ? roomCount : null,
    imageUrl: selectedItem.imageUrl || selectedItem.image || null,
  };

  const cardPricing = {
    basePrice,
    guestCount: quantity,
    taxesAndFees,
    subtotal,
    fareLabel,
    total: totalAmount,
  };

  // Step 1: Submit traveller details
  const handleDetailsSubmit = (formData) => {
    setTravellerDetails(formData);
    setCurrentStepIndex(2); // Advance to Payment step
  };

  // Step 2: Trigger payment processing via Payment Adapter and persist to backend
  const handleProcessPayment = async () => {
    setErrorMessage('');
    if (dateError) {
      setErrorMessage(dateError);
      return;
    }
    setIsProcessing(true);

    // Verify authenticated traveller session
    const savedUser = typeof getSavedUser === 'function' ? getSavedUser() : null;
    const activeUser = user || savedUser || null;
    const activeUserId = activeUser?.userId || activeUser?.id || activeUser?.username;

    if (!activeUserId) {
      setErrorMessage('Authentication required. Please sign in to your traveller account before completing checkout.');
      setIsProcessing(false);
      return;
    }

    const bookingType = (selectedItem.type || '').toLowerCase();

    // Verify that hotel exists and is active in the backend
    if (bookingType === 'hotel' || !bookingType) {
      if (!selectedItem.id) {
        setErrorMessage('No hotel selected. Please choose a valid property to book.');
        setIsProcessing(false);
        return;
      }

      try {
        const hotelRecord = await apiRequest(`/hotels/${encodeURIComponent(selectedItem.id)}`);
        if (!hotelRecord || hotelRecord.status !== 'active') {
          setErrorMessage(
            `The selected hotel (${selectedItem.title || selectedItem.name || selectedItem.id}) is currently unavailable for booking. Please select an active property.`
          );
          setIsProcessing(false);
          return;
        }
      } catch (checkErr) {
        const notFound = checkErr?.status === 404 || String(checkErr?.message || '').toLowerCase().includes('not found');
        setErrorMessage(
          notFound
            ? `The selected hotel (${selectedItem.title || selectedItem.name || selectedItem.id}) is not integrated with the reservation backend. Please select an available property.`
            : (checkErr?.message || 'Unable to verify hotel availability.')
        );
        setIsProcessing(false);
        return;
      }
    } else if (bookingType === 'experience') {
      if (!selectedItem.id) {
        setErrorMessage('No experience selected. Please choose a valid experience to book.');
        setIsProcessing(false);
        return;
      }
    }

    try {
      // 1. Create simulated order
      const order = await paymentAdapter.createOrder({
        bookingId: selectedItem.id || 'demo-booking-1',
        bookingType: bookingType || 'hotel',
        amount: totalAmount,
        guestCount: Number(guestCount),
        travellerDetails,
      });

      // 2. Process / verify outcome via adapter
      const result = await paymentAdapter.verifyPayment({
        orderId: order.orderId,
        method: selectedMethod,
        simulatedOutcome,
      });

      if (!result.success) {
        setPaymentResult(result);
        setErrorMessage(result.errorMessage || 'Simulated payment was not successful.');
        setCurrentStepIndex(3); // Advance to Confirmation failure view
        return;
      }

      // 3. Persist to real backend (only if payment succeeded)
      if (!hasPersistedRef.current) {
        if (!persistenceIdRef.current) {
          persistenceIdRef.current = result.paymentId || `pay-${Date.now()}`;
        }
        const stablePaymentId = persistenceIdRef.current;

        const guestFullName = [travellerDetails.firstName, travellerDetails.lastName].filter(Boolean).join(' ') || 'Anjali Sharma';
        const guestEmail = travellerDetails.email || 'anjali@xploreo.com';
        const guestPhone = travellerDetails.phone || '+91 9876543210';

        if (bookingType === 'plan' || bookingType === 'package' || bookingType === 'trip') {
          await apiRequest('/trips', {
            method: 'POST',
            body: JSON.stringify({
              id: `trip-${stablePaymentId}`,
              travellerId: activeUserId,
              planId: selectedItem.id || selectedItem.planId || 'plan-1',
              itinerary: selectedItem.itinerary,
            }),
          });
        } else if (bookingType === 'experience') {
          const createdBooking = await apiRequest('/experience-bookings', {
            method: 'POST',
            body: JSON.stringify({
              id: `eb-${stablePaymentId}`,
              experienceId: selectedItem.id,
              guestName: guestFullName,
              email: guestEmail,
              phone: guestPhone,
              date: selectedItem.checkIn || selectedItem.date || new Date().toISOString().split('T')[0],
              participants: Number(guestCount) || 1,
            }),
          });
          setCreatedExperience(createdBooking);
        } else {
          const today = new Date();
          const checkIn = selectedItem.checkIn || today.toISOString().split('T')[0];
          const checkOut = selectedItem.checkOut || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
          await apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify({
              id: `b-${stablePaymentId}`,
              hotelId: selectedItem.id,
              guestName: guestFullName,
              email: guestEmail,
              phone: guestPhone,
              checkIn,
              checkOut,
              guests: Number(guestCount) || 1,
              roomType: selectedItem.roomType || 'Standard Room',
              rooms: roomCount,
              notes: travellerDetails.specialRequests || 'Booked via checkout',
            }),
          });
        }

        hasPersistedRef.current = true;
      }

      setPaymentResult(result);
      setCurrentStepIndex(3); // Advance to Confirmation step only on verified success

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Payment processing failed.');
      // Keep user on payment step (currentStepIndex = 2) so they can correct details and retry safely
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="trav-checkout-wrapper">
      {/* Minimal Checkout-Specific Top Navigation */}
      <header className="trav-checkout-navbar">
        <div className="trav-checkout-navbar-inner">
          <button
            type="button"
            className="trav-checkout-back-link"
            onClick={() => {
              if (currentStepIndex > 0 && currentStepIndex < 3) {
                setCurrentStepIndex(currentStepIndex - 1);
              } else {
                navigate('/Traveller/browse');
              }
            }}
            aria-label="Back to browse or previous step"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>
              {currentStepIndex === 0
                ? 'Back to Browse'
                : currentStepIndex === 3
                ? 'Back to Dashboard'
                : 'Back to Previous Step'}
            </span>
          </button>

          <Link to="/Traveller/dashboard" className="trav-checkout-brand" aria-label="Xploreo Home">
            <img src={logo} alt="Xploreo" className="trav-checkout-logo-img" />
            <span className="trav-checkout-brand-title">Xploreo</span>
          </Link>

          <div className="trav-checkout-security-pill">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      <main className="trav-checkout-page" data-testid="traveller-checkout-page">
        <header className="trav-checkout-header">
          <div className="trav-checkout-eyebrow">
            <span className="trav-checkout-eyebrow-dot" aria-hidden="true" />
            <span>Checkout &amp; Payment Demo</span>
          </div>
          <h1 className="trav-checkout-title">Complete Your Reservation</h1>
          <p className="trav-checkout-subtitle">
            Experience our streamlined checkout flow powered by the explicit Mock Payment Adapter.
          </p>
        </header>

        {/* Demo Mode Notice Banner */}
        <div className="trav-checkout-demo-banner" role="alert" data-testid="checkout-demo-banner">
          <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <strong>Demo Checkout Mode Active:</strong> This checkout session is connected to the <code>MockPaymentAdapter</code>. Real credit cards are not charged and no real financial transactions take place.
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="trav-checkout-stepper-wrap">
          <CheckoutStepper
            steps={DEFAULT_CHECKOUT_STEPS}
            currentStepIndex={currentStepIndex}
            onStepClick={(index) => {
              // Only allow jumping back to prior completed steps
              if (index < currentStepIndex && !isProcessing) {
                setCurrentStepIndex(index);
              }
            }}
          />
        </div>

        {/* Main Two-Column Content for Steps 0, 1, 2 */}
        {currentStepIndex < 3 ? (
          <div className="trav-checkout-grid">
            {/* Left Column: Active Step Form */}
            <div className="trav-checkout-main-col">
              {/* Step 0: Review Booking */}
              {currentStepIndex === 0 && (
                <section className="trav-checkout-content-card" data-testid="checkout-step-review">
                  <div className="trav-checkout-section-header">
                    <span className="trav-step-badge-pill">Step 1 of 4</span>
                    <h2 className="trav-checkout-section-title">Step 1: Review Itinerary &amp; Pricing</h2>
                    <p className="trav-checkout-section-desc">
                      Please verify your reservation details, schedule, and guest count before continuing.
                    </p>
                  </div>

                  {/* Selected Item Spotlight */}
                  <div className="trav-review-spotlight">
                    <div className="trav-review-spotlight-top">
                      {cardBooking.imageUrl && (
                        <img
                          src={cardBooking.imageUrl}
                          alt={cardBooking.title}
                          className="trav-review-spotlight-img"
                        />
                      )}
                      <div className="trav-review-spotlight-info">
                        <span className="trav-review-type-badge">{cardBooking.type}</span>
                        <h3 className="trav-review-spotlight-title">{cardBooking.title}</h3>
                        <p className="trav-review-spotlight-loc">
                          <span aria-hidden="true">📍</span>
                          <span>{cardBooking.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="trav-review-schedule-grid">
                      <div className="trav-review-schedule-item">
                        <span className="trav-review-schedule-label">Dates / Schedule</span>
                        <span className="trav-review-schedule-val">{cardBooking.date || 'Flexible schedule'}</span>
                      </div>
                      <div className="trav-review-schedule-item trav-review-guest-picker">
                        <label htmlFor="checkout-guests-select" className="trav-review-schedule-label">
                          Guests / Party
                        </label>
                        <div className="trav-guest-selector-wrap">
                          <button
                            type="button"
                            className="trav-guest-step-btn"
                            onClick={() => handleGuestChange(guestCount - 1)}
                            disabled={guestCount <= minGuests}
                            aria-label="Decrease guest count"
                            data-testid="guest-decrement-btn"
                          >
                            −
                          </button>
                          <div className="trav-guest-select-container">
                            <select
                              id="checkout-guests-select"
                              className="trav-guest-select"
                              value={guestCount}
                              onChange={(e) => handleGuestChange(Number(e.target.value))}
                              aria-label="Select guest count"
                              data-testid="checkout-guest-select"
                            >
                              {Array.from({ length: maxGuests - minGuests + 1 }, (_, i) => minGuests + i).map((num) => (
                                <option key={num} value={num}>
                                  {num} {num === 1 ? 'Guest' : 'Guests'}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            className="trav-guest-step-btn"
                            onClick={() => handleGuestChange(guestCount + 1)}
                            disabled={guestCount >= maxGuests}
                            aria-label="Increase guest count"
                            data-testid="guest-increment-btn"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="trav-review-inclusions-card">
                      <h4 className="trav-inclusions-title">Booking Highlights &amp; Reassurances</h4>
                      <ul className="trav-inclusions-list">
                        <li className="trav-inclusions-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>Free cancellation up to 24 hours prior</span>
                        </li>
                        <li className="trav-inclusions-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>Instant demo confirmation &amp; voucher generation</span>
                        </li>
                        <li className="trav-inclusions-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>24/7 dedicated Traveller Concierge support</span>
                        </li>
                        <li className="trav-inclusions-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>Verified authentic partner listing on Xploreo</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {dateError ? (
                    <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                      ⚠️ {dateError} Go back and pick valid dates.
                    </div>
                  ) : null}

                  <div className="trav-checkout-actions">
                    <button
                      type="button"
                      className="trav-btn-secondary"
                      onClick={() => navigate('/Traveller/browse')}
                    >
                      ← Back to Browse
                    </button>
                    <button
                      type="button"
                      className="trav-btn-primary"
                      disabled={Boolean(dateError)}
                      onClick={() => setCurrentStepIndex(1)}
                      data-testid="btn-proceed-to-details"
                    >
                      Proceed to Traveller Details →
                    </button>
                  </div>
                </section>
              )}

              {/* Step 1: Traveller Details Form */}
              {currentStepIndex === 1 && (
                <section className="trav-checkout-content-card" data-testid="checkout-step-details">
                  <div className="trav-checkout-section-header">
                    <span className="trav-step-badge-pill">Step 2 of 4</span>
                    <h2 className="trav-checkout-section-title">Step 2: Traveller Contact Details</h2>
                    <p className="trav-checkout-section-desc">
                      Provide contact information for the lead traveller to receive vouchers and trip alerts.
                    </p>
                  </div>
                  <TravellerDetailsForm
                    initialValues={travellerDetails}
                    onSubmit={handleDetailsSubmit}
                    submitLabel="Proceed to Payment Selection"
                  />
                  <div style={{ marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="trav-btn-secondary"
                      onClick={() => setCurrentStepIndex(0)}
                    >
                      ← Back to Itinerary Review
                    </button>
                  </div>
                </section>
              )}

              {/* Step 2: Payment Method & Simulation Controls */}
              {currentStepIndex === 2 && (
                <section className="trav-checkout-content-card" data-testid="checkout-step-payment">
                  <div className="trav-checkout-section-header">
                    <span className="trav-step-badge-pill">Step 3 of 4</span>
                    <h2 className="trav-checkout-section-title">Step 3: Select Payment Method</h2>
                    <p className="trav-checkout-section-desc">
                      Choose your simulated payment channel and test out adapter processing scenarios.
                    </p>
                  </div>

                  {errorMessage && (
                    <div
                      className="trav-checkout-error-banner"
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      role="alert"
                    >
                      <span aria-hidden="true">⚠️</span>
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <PaymentMethodSelector
                    selectedMethod={selectedMethod}
                    onSelectMethod={setSelectedMethod}
                    methods={DEFAULT_PAYMENT_METHODS}
                    disabled={isProcessing}
                  />

                  {/* Simulation Controls for testing outcomes */}
                  <div className="trav-simulation-panel" data-testid="simulation-outcome-controls">
                    <h3 className="trav-simulation-title">
                      🧪 Test Simulation Outcome (Demo Mode Control)
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                      Select how you would like the Mock Payment Adapter to respond when processing:
                    </p>
                    <div className="trav-simulation-options" role="radiogroup" aria-label="Simulated payment outcome">
                      <label className={`trav-simulation-label ${simulatedOutcome === 'SUCCESS' ? 'is-active' : ''}`}>
                        <input
                          type="radio"
                          name="simOutcome"
                          value="SUCCESS"
                          checked={simulatedOutcome === 'SUCCESS'}
                          onChange={() => setSimulatedOutcome('SUCCESS')}
                        />
                        <span>Simulate Success (Approved)</span>
                      </label>
                      <label className={`trav-simulation-label ${simulatedOutcome === 'FAILURE' ? 'is-active' : ''}`}>
                        <input
                          type="radio"
                          name="simOutcome"
                          value="FAILURE"
                          checked={simulatedOutcome === 'FAILURE'}
                          onChange={() => setSimulatedOutcome('FAILURE')}
                        />
                        <span>Simulate Card Decline / Failure</span>
                      </label>
                      <label className={`trav-simulation-label ${simulatedOutcome === 'CANCEL' ? 'is-active' : ''}`}>
                        <input
                          type="radio"
                          name="simOutcome"
                          value="CANCEL"
                          checked={simulatedOutcome === 'CANCEL'}
                          onChange={() => setSimulatedOutcome('CANCEL')}
                        />
                        <span>Simulate User Cancellation</span>
                      </label>
                    </div>
                  </div>

                  <div className="trav-checkout-actions">
                    <button
                      type="button"
                      className="trav-btn-secondary"
                      disabled={isProcessing}
                      onClick={() => setCurrentStepIndex(1)}
                    >
                      ← Back to Details
                    </button>
                    <button
                      type="button"
                      className="trav-btn-primary"
                      disabled={isProcessing}
                      onClick={handleProcessPayment}
                      data-testid="btn-process-payment"
                    >
                      {isProcessing
                        ? 'Processing Demo Payment...'
                        : `Pay Demo Amount (${formatCurrency(totalAmount)})`}
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Sticky Booking Summary & Pricing Breakdown */}
            <aside className="trav-checkout-sidebar-col">
              <div className="trav-checkout-sidebar-sticky">
                <BookingSummaryCard booking={cardBooking} pricing={cardPricing} />

                {/* Prominent Total Payable Banner */}
                <div className="trav-payable-highlight-card">
                  <div className="trav-payable-row">
                    <div>
                      <span className="trav-payable-label">Total Payable Amount</span>
                      <span className="trav-payable-sublabel">Inclusive of all demo taxes &amp; fees</span>
                    </div>
                    <div className="trav-payable-amount">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Security & Reassurance Card */}
                <div className="trav-checkout-trust-card">
                  <div className="trav-trust-item">
                    <span className="trav-trust-icon" aria-hidden="true">🔒</span>
                    <div>
                      <span className="trav-trust-title">Safe &amp; Encrypted</span>
                      <span className="trav-trust-desc">Simulated 256-bit SSL session</span>
                    </div>
                  </div>
                  <div className="trav-trust-item">
                    <span className="trav-trust-icon" aria-hidden="true">⚡</span>
                    <div>
                      <span className="trav-trust-title">Instant Confirmation</span>
                      <span className="trav-trust-desc">Demo reservation voucher issued</span>
                    </div>
                  </div>
                  <div className="trav-trust-item">
                    <span className="trav-trust-icon" aria-hidden="true">🛡️</span>
                    <div>
                      <span className="trav-trust-title">Zero Risk Simulation</span>
                      <span className="trav-trust-desc">Powered by Mock Payment Adapter</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* Step 3: Confirmation / Outcome */
          <section className="trav-checkout-content-card trav-checkout-outcome-card" data-testid="checkout-step-confirmation">
            {paymentResult?.success ? (
              <div className="trav-confirmation-view" data-testid="checkout-outcome-success">
                <div className="trav-confirm-icon-success" aria-hidden="true">✓</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', margin: '0 0 0.5rem 0' }}>
                  Demo Payment Successful!
                </h2>
                <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                  Your simulated reservation has been recorded in Demo Mode. No real financial charges were made.
                </p>

                <div className="trav-receipt-card" data-testid="demo-receipt">
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}
                    >
                      DEMO RECEIPT — NO REAL PAYMENT
                    </span>
                  </div>
                  <div className="trav-receipt-row">
                    <span>Receipt Reference:</span>
                    <strong>{paymentResult.receiptId}</strong>
                  </div>
                  <div className="trav-receipt-row">
                    <span>Simulated Order ID:</span>
                    <span>{paymentResult.orderId}</span>
                  </div>
                  <div className="trav-receipt-row">
                    <span>Payment Method:</span>
                    <span style={{ textTransform: 'uppercase' }}>{paymentResult.method}</span>
                  </div>
                  <div className="trav-receipt-row">
                    <span>Lead Traveller:</span>
                    <span>{travellerDetails.firstName} {travellerDetails.lastName}</span>
                  </div>
                  <div className="trav-receipt-row">
                    <span>Reservation:</span>
                    <span>{cardBooking.title}</span>
                  </div>
                  <div className="trav-receipt-row">
                    <span>Guests / Party:</span>
                    <strong data-testid="receipt-guest-count">
                      {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                    </strong>
                  </div>
                  {isStay && (
                    <div className="trav-receipt-row">
                      <span>Rooms:</span>
                      <strong>{roomCount} {roomCount === 1 ? 'Room' : 'Rooms'}</strong>
                    </div>
                  )}
                  <div className="trav-receipt-row">
                    <span>Simulated Amount:</span>
                    <span style={{ color: '#15803d' }}>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {createdExperience ? (
                  <div style={{ maxWidth: 520, margin: '1.25rem auto 0', textAlign: 'left' }}>
                    <ExperienceGuidePanel booking={createdExperience} askFirst />
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="trav-btn-secondary"
                    onClick={() => navigate(['plan', 'package', 'trip'].includes(itemType) ? '/Traveller/trips' : '/Traveller/bookings')}
                  >
                    {['plan', 'package', 'trip'].includes(itemType) ? 'View in My Trips' : 'View in My Bookings'}
                  </button>
                  <button
                    type="button"
                    className="trav-btn-primary"
                    onClick={() => navigate('/Traveller/dashboard')}
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : paymentResult?.status === 'CANCELLED' ? (
              <div className="trav-confirmation-view" data-testid="checkout-outcome-cancelled">
                <div className="trav-confirm-icon-cancel" aria-hidden="true">⚠️</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', margin: '0 0 0.5rem 0' }}>
                  Simulated Payment Cancelled
                </h2>
                <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                  {paymentResult.errorMessage || 'The payment session was cancelled. No charges occurred.'}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="trav-btn-secondary"
                    onClick={() => navigate('/Traveller/browse')}
                  >
                    Exit Checkout
                  </button>
                  <button
                    type="button"
                    className="trav-btn-primary"
                    onClick={() => setCurrentStepIndex(2)}
                  >
                    Try Another Payment
                  </button>
                </div>
              </div>
            ) : (
              <div className="trav-confirmation-view" data-testid="checkout-outcome-failed">
                <div className="trav-confirm-icon-error" aria-hidden="true">✕</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', margin: '0 0 0.5rem 0' }}>
                  Simulated Payment Failed
                </h2>
                <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                  {errorMessage || 'The demo payment was declined by the simulated payment processor.'}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="trav-btn-secondary"
                    onClick={() => navigate('/Traveller/dashboard')}
                  >
                    Return to Dashboard
                  </button>
                  <button
                    type="button"
                    className="trav-btn-primary"
                    onClick={() => setCurrentStepIndex(2)}
                  >
                    Retry Payment (Change Method/Outcome)
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
