import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Booking, BookingStatus } from './entities/booking.entity';

type CreateBookingRecord = Omit<
  Booking,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'hotel'
>;

@Injectable()
export class BookingsRepository {
  private readonly bookings: Booking[] = [];

  create(data: CreateBookingRecord): Booking {
    const now = new Date();
    const booking: Booking = {
      id: randomUUID(),
      ...data,
      status: BookingStatus.CONFIRMED,
      createdAt: now,
      updatedAt: now,
    };

    this.bookings.push(booking);
    return { ...booking };
  }

  findAll(): Booking[] {
    return this.bookings.map((booking) => ({ ...booking }));
  }

  findById(id: string): Booking | undefined {
    const booking = this.bookings.find((item) => item.id === id);
    return booking ? { ...booking } : undefined;
  }

  findRawById(id: string): Booking | undefined {
    return this.bookings.find((item) => item.id === id);
  }

  findByHotelIds(hotelIds: string[]): Booking[] {
    const hotelIdSet = new Set(hotelIds);
    return this.bookings
      .filter((booking) => hotelIdSet.has(booking.hotelId))
      .map((booking) => ({ ...booking }));
  }

  findByTravellerId(travellerId: string): Booking[] {
    return this.bookings
      .filter((booking) => booking.travellerId === travellerId)
      .map((booking) => ({ ...booking }));
  }

  setStatus(id: string, status: BookingStatus): Booking | undefined {
    const booking = this.bookings.find((item) => item.id === id);
    if (!booking) return undefined;
    booking.status = status;
    booking.updatedAt = new Date();
    return { ...booking };
  }

  setCheckOutDate(id: string, checkOut: string): void {
    const booking = this.bookings.find((item) => item.id === id);
    if (booking) booking.checkOut = checkOut;
  }
}
