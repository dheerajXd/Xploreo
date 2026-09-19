import React, { useState } from "react";

import "../../../../front_end/css/shared.css";
import "../../../../front_end/css/hotelstyle.css";

function Bookings() {
  const [bookings] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("hotelBookings") || "[]"
      );
    } catch {
      return [];
    }
  });

  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "CONFIRMED"
  ).length;

  const revenue = bookings.reduce(
    (sum, booking) =>
      sum + Number(booking.totalAmount || 0),
    0
  );

  return (
    <main id="main" className="dashboard-wrapper">

      {/* Page Header */}
      <div className="hotel-page-header">
        <h1>Bookings</h1>
        <p>
          Manage and track all traveller hotel reservations
        </p>
      </div>

      {/* Summary */}
      <section className="hotel-content-card hotel-summary-strip">

        <div>
          <span>Total Bookings</span>
          <strong>{bookings.length}</strong>
        </div>

        <div>
          <span>Confirmed</span>
          <strong>{confirmedBookings}</strong>
        </div>

        <div>
          <span>Revenue</span>
          <strong>
            ₹{revenue.toLocaleString()}
          </strong>
        </div>

      </section>

      {/* Booking List */}
      <div id="booking-list">

        {bookings.length > 0 ? (

          bookings.map((booking, index) => (
            <BookingCard
              key={booking.id || booking.bookingId || index}
              booking={booking}
            />
          ))

        ) : (

          <div className="hotel-empty-state">
            <h2>No bookings yet</h2>
            <p>
              Bookings created by travellers for your hotels
              will appear here immediately.
            </p>
          </div>

        )}

      </div>

    </main>
  );
}

function BookingCard({ booking }) {
  const hotel = booking.hotel || {};

  return (
    <article className="hotel-booking-card">

      {/* Guest Details */}
      <div className="hotel-booking-left">

        <h3>{booking.guestName}</h3>

        <p>{booking.email}</p>

        <p>{booking.phone}</p>

      </div>

      {/* Dates and Status */}
      <div className="hotel-booking-middle">

        <div>
          <small>Check-in</small>
          <p>{booking.checkIn}</p>
        </div>

        <div>→</div>

        <div>
          <small>Check-out</small>
          <p>{booking.checkOut}</p>
        </div>

        <div className="hotel-badge">
          {booking.status}
        </div>

      </div>

      {/* Hotel and Amount */}
      <div className="hotel-booking-right">

        <h3>
          ₹{Number(
            booking.totalAmount || 0
          ).toLocaleString()}
        </h3>

        <p>
          {hotel.name || booking.hotelId}
        </p>

        <p>
          {booking.roomType} ·{" "}
          {Number(booking.guests || 1)} guests
        </p>

      </div>

    </article>
  );
}

export default Bookings;