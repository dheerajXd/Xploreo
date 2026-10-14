import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ExperienceBooking,
  ExperienceBookingStatus,
} from './entities/experience-booking.entity';

type CreateExperienceBookingRecord = Omit<
  ExperienceBooking,
  'id' | 'status' | 'createdAt' | 'experience'
>;

@Injectable()
export class ExperienceBookingsRepository {
  private readonly bookings: ExperienceBooking[] = [];

  create(data: CreateExperienceBookingRecord): ExperienceBooking {
    const booking: ExperienceBooking = {
      id: randomUUID(),
      ...data,
      status: ExperienceBookingStatus.CONFIRMED,
      createdAt: new Date(),
    };

    this.bookings.push(booking);
    return { ...booking };
  }

  findAll(): ExperienceBooking[] {
    return this.bookings.map((booking) => ({ ...booking }));
  }

  findByTravellerId(travellerId: string): ExperienceBooking[] {
    return this.bookings
      .filter((booking) => booking.travellerId === travellerId)
      .map((booking) => ({ ...booking }));
  }

  findByExperienceIds(experienceIds: string[]): ExperienceBooking[] {
    const ids = new Set(experienceIds);
    return this.bookings
      .filter((booking) => ids.has(booking.experienceId))
      .map((booking) => ({ ...booking }));
  }

  findById(id: string): ExperienceBooking | undefined {
    const booking = this.bookings.find((b) => b.id === id);
    return booking ? { ...booking } : undefined;
  }

  setStatus(id: string, status: ExperienceBookingStatus): ExperienceBooking | undefined {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) return undefined;
    booking.status = status;
    return { ...booking };
  }
}
