import { Injectable } from '@nestjs/common';
import { normalizeStructuredItinerary } from '../common/utils/itinerary-mapper';
import { createId } from '../common/utils/id';
import { stripUndefined } from '../common/utils/strip-undefined';
import { Trip, TripStatus, TripTrackingStatus } from './entities/trip.entity';

@Injectable()
export class TripsRepository {
  private trips: Trip[] = [
    {
      id: 'trip-kerala-1',
      travellerId: 'T001',
      planId: 'plan-1',
      guideId: 'G001',
      status: TripStatus.CONFIRMED,
      itinerary: normalizeStructuredItinerary([
        { day: 'Day 1', title: 'Arrival in Kochi', detail: 'Transfer to Alleppey and check in to houseboat.' },
        { day: 'Day 2', title: 'Backwater Cruise', detail: 'Full day cruise through the canals.' },
      ], {
        idPrefix: 'trip-kerala-1',
        originCity: 'Bangalore',
        destination: 'Kerala',
        startDate: '2026-05-12',
        endDate: '2026-05-17',
        includesFlight: true,
        hotelStars: 4,
      }),
      totalAmount: 47000,
      currentDay: 1,
      currentStop: 'Not started',
      currentLocation: 'Bangalore',
      trackingStatus: TripTrackingStatus.NOT_STARTED,
      progressPercentage: 0,
      lastUpdatedAt: new Date().toISOString(),
    },
    {
      id: 'trip-jaipur-1',
      travellerId: '20002',
      planId: 'plan-2',
      guideId: 'G001',
      status: TripStatus.STARTED,
      itinerary: normalizeStructuredItinerary([
        { day: 'Day 1', title: 'Jaipur Arrival', detail: 'Check in and visit City Palace.' },
        { day: 'Day 2', title: 'Amber Fort', detail: 'Explore the grand Amber Fort.' },
      ], {
        idPrefix: 'trip-jaipur-1',
        originCity: 'Delhi',
        destination: 'Jaipur',
        startDate: '2026-05-18',
        endDate: '2026-05-25',
        includesFlight: false,
        hotelStars: 5,
      }),
      totalAmount: 38500,
      currentDay: 1,
      currentStop: 'Jaipur Arrival',
      currentLocation: 'Jaipur',
      trackingStatus: TripTrackingStatus.ONGOING,
      progressPercentage: 25,
      lastUpdatedAt: new Date().toISOString(),
    },
    {
      id: 'trip-kerala-completed',
      travellerId: 'T001',
      planId: 'plan-1',
      guideId: 'G001',
      status: TripStatus.COMPLETED,
      itinerary: normalizeStructuredItinerary([
        { day: 'Day 1', title: 'Arrival in Kochi', detail: 'Transfer to Alleppey and check in to houseboat.' },
        { day: 'Day 2', title: 'Backwater Cruise', detail: 'Full day cruise through the canals.' },
      ], {
        idPrefix: 'trip-kerala-completed',
        originCity: 'Bangalore',
        destination: 'Kerala',
        startDate: '2026-04-12',
        endDate: '2026-04-17',
        includesFlight: true,
        hotelStars: 4,
      }),
      totalAmount: 47000,
      currentDay: 2,
      currentStop: 'Completed',
      currentLocation: 'Alleppey',
      trackingStatus: TripTrackingStatus.COMPLETED,
      progressPercentage: 100,
      lastUpdatedAt: new Date().toISOString(),
    },
    {
      id: 'trip-goa-completed',
      travellerId: '20002',
      planId: 'plan-3',
      guideId: 'G001',
      status: TripStatus.COMPLETED,
      itinerary: normalizeStructuredItinerary([
        { day: 'Day 1', title: 'Arrival in Goa', detail: 'Check in to beach resort, evening at leisure.' },
        { day: 'Day 2', title: 'North Goa Tour', detail: 'Forts, beaches and flea market.' },
      ], {
        idPrefix: 'trip-goa-completed',
        originCity: 'Mumbai',
        destination: 'Goa',
        startDate: '2026-03-02',
        endDate: '2026-03-06',
        includesFlight: true,
        hotelStars: 4,
      }),
      totalAmount: 32500,
      currentDay: 2,
      currentStop: 'Completed',
      currentLocation: 'Goa',
      trackingStatus: TripTrackingStatus.COMPLETED,
      progressPercentage: 100,
      lastUpdatedAt: new Date().toISOString(),
    },
    {
      id: 'trip-manali-refunded',
      travellerId: '20004',
      planId: 'plan-4',
      guideId: 'G001',
      status: TripStatus.COMPLETED,
      itinerary: normalizeStructuredItinerary([
        { day: 'Day 1', title: 'Arrival in Manali', detail: 'Check in and acclimatize.' },
        { day: 'Day 2', title: 'Solang Valley', detail: 'Adventure activities and sightseeing.' },
      ], {
        idPrefix: 'trip-manali-refunded',
        originCity: 'Delhi',
        destination: 'Manali',
        startDate: '2026-02-10',
        endDate: '2026-02-14',
        includesFlight: false,
        hotelStars: 3,
      }),
      totalAmount: 28000,
      refundAmount: 28000,
      currentDay: 2,
      currentStop: 'Completed',
      currentLocation: 'Manali',
      trackingStatus: TripTrackingStatus.COMPLETED,
      progressPercentage: 100,
      lastUpdatedAt: new Date().toISOString(),
    },
    {
      id: 'trip-guide-request-1',
      travellerId: '20004',
      planId: 'plan-1',
      status: TripStatus.DRAFT,
      itinerary: normalizeStructuredItinerary([
        { day: 'Day 1', title: 'Arrival in Kochi', detail: 'Transfer to Alleppey and check in to houseboat.' },
        { day: 'Day 2', title: 'Backwater Cruise', detail: 'Full day cruise through the canals.' },
      ], {
        idPrefix: 'trip-guide-request-1',
        originCity: 'Bangalore',
        destination: 'Kerala',
        startDate: '2026-06-03',
        endDate: '2026-06-08',
        includesFlight: true,
        hotelStars: 4,
      }),
      totalAmount: 47000,
      currentDay: 1,
      currentStop: 'Not started',
      currentLocation: 'Bangalore',
      trackingStatus: TripTrackingStatus.NOT_STARTED,
      progressPercentage: 0,
      lastUpdatedAt: new Date().toISOString(),
    },
  ];

  create(data: Omit<Trip, 'id'> & { id?: string }): Trip {
    if (data.id) {
      const existing = this.findById(data.id);
      if (existing) return existing;
    }

    const trip: Trip = {
      id: data.id || createId(),
      travellerId: data.travellerId,
      planId: data.planId,
      guideId: data.guideId,
      status: data.status || TripStatus.CONFIRMED,
      itinerary: data.itinerary,
      totalAmount: data.totalAmount,
      currentDay: data.currentDay ?? 1,
      currentStop: data.currentStop ?? 'Not started',
      currentLocation: data.currentLocation ?? '',
      trackingStatus: data.trackingStatus ?? TripTrackingStatus.NOT_STARTED,
      progressPercentage: data.progressPercentage ?? 0,
      lastUpdatedAt: data.lastUpdatedAt ?? new Date().toISOString(),
    };

    this.trips.push(trip);
    return trip;
  }

  findAll(): Trip[] {
    return [...this.trips];
  }

  findById(id: string): Trip | undefined {
    return this.trips.find((trip) => trip.id === id);
  }

  findByTraveller(travellerId: string): Trip[] {
    const normalized = String(travellerId).trim().toLowerCase();
    const isAnjali =
      normalized === 't001' ||
      normalized === '20001' ||
      normalized === 'trav-usr-20001';

    return this.trips.filter((trip) => {
      const tripTraveller = String(trip.travellerId).trim().toLowerCase();
      if (tripTraveller === normalized) return true;
      if (
        isAnjali &&
        (tripTraveller === '20001' ||
          tripTraveller === 't001' ||
          tripTraveller === 'trav-usr-20001')
      ) {
        return true;
      }
      return false;
    });
  }

  findByGuide(guideId: string): Trip[] {
    return this.trips.filter((trip) => trip.guideId === guideId);
  }

  update(id: string, data: Partial<Trip>): Trip | undefined {
    const index = this.trips.findIndex((trip) => trip.id === id);
    if (index === -1) return undefined;

    const patch = stripUndefined(data);
    this.trips[index] = {
      ...this.trips[index],
      ...patch,
      itinerary: patch.itinerary || this.trips[index].itinerary,
    };

    return this.trips[index];
  }

  delete(id: string): boolean {
    const index = this.trips.findIndex((trip) => trip.id === id);
    if (index === -1) return false;
    this.trips.splice(index, 1);
    return true;
  }
}
