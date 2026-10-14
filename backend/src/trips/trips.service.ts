import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StructuredItinerary } from '../common/entities/itinerary.entity';
import { mergeStructuredItineraryPatch } from '../common/utils/itinerary-mapper';
import { PlansRepository } from '../plans/plans.repository';
import { GuideApplicationsRepository } from '../guide-applications/guide-applications.repository';
import { GuideApplicationStatus } from '../guide-applications/entities/guide-application.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripTrackingDto } from './dto/update-trip-tracking.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip, TripStatus, TripTrackingStatus } from './entities/trip.entity';
import { TripsRepository } from './trips.repository';

@Injectable()
export class TripsService {
  constructor(
    private readonly tripsRepository: TripsRepository,
    private readonly plansRepository: PlansRepository,
    private readonly guideApplicationsRepository: GuideApplicationsRepository,
  ) {}

  create(dto: CreateTripDto) {
    let plan = this.plansRepository.findById(dto.planId);
    if (!plan) {
      const allPlans = this.plansRepository.findAll().data;
      plan =
        allPlans.find(
          (p) =>
            p.id === dto.planId ||
            p.destination.toLowerCase() === dto.planId.toLowerCase(),
        ) || allPlans[0];
    }
    if (!plan) throw new NotFoundException(`Plan ${dto.planId} not found`);

    const itinerary = dto.itinerary || plan.itinerary;

    const trip = this.tripsRepository.create({
      id: dto.id,
      travellerId: dto.travellerId,
      planId: plan.id,
      status: TripStatus.CONFIRMED,
      itinerary,
      totalAmount: this.calculateTotalAmount(itinerary, plan.pricePerPerson),
      currentDay: 1,
      currentStop: 'Not started',
      currentLocation: itinerary.day1?.transport?.pickupLocation || plan.originCity,
      trackingStatus: TripTrackingStatus.NOT_STARTED,
      progressPercentage: 0,
      lastUpdatedAt: new Date().toISOString(),
    });

    // If a guide already applied (and was auto-accepted) to lead this plan, offer them the
    // job as a pending assignment instead of leaving the trip unassigned.
    const candidate = this.guideApplicationsRepository
      .findAll()
      .find((a) => a.planId === dto.planId && a.status === GuideApplicationStatus.ACCEPTED);
    if (candidate) {
      return this.assignPendingGuide(trip.id, candidate.guideId);
    }
    return trip;
  }

  // ── Guide-assignment lifecycle (a trip offered to a guide, pending their response) ──
  assignPendingGuide(tripId: string, guideId: string): Trip {
    const updated = this.tripsRepository.update(tripId, {
      guideId,
      status: TripStatus.PENDING_GUIDE_CONFIRM,
    });
    if (!updated) throw new NotFoundException(`Trip ${tripId} not found`);
    return updated;
  }

  confirmByGuide(tripId: string, guideId: string | undefined): Trip {
    const trip = this.findOne(tripId);
    if (!guideId || trip.guideId !== guideId) {
      throw new ForbiddenException('You are not assigned to this booking');
    }
    if (trip.status !== TripStatus.PENDING_GUIDE_CONFIRM) {
      throw new BadRequestException(
        `Only pending assignments can be confirmed (current: ${trip.status})`,
      );
    }
    const updated = this.tripsRepository.update(tripId, { status: TripStatus.CONFIRMED });
    if (!updated) throw new NotFoundException(`Trip ${tripId} not found`);
    return updated;
  }

  rejectByGuide(tripId: string, guideId: string | undefined): Trip {
    const trip = this.findOne(tripId);
    if (!guideId || trip.guideId !== guideId) {
      throw new ForbiddenException('You are not assigned to this booking');
    }
    if (trip.status !== TripStatus.PENDING_GUIDE_CONFIRM && trip.status !== TripStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot reject at this stage (current: ${trip.status})`);
    }
    const updated = this.tripsRepository.update(tripId, {
      status: TripStatus.REJECTED_BY_GUIDE,
      refundAmount: trip.totalAmount,
    });
    if (!updated) throw new NotFoundException(`Trip ${tripId} not found`);
    return updated;
  }

  findAssignmentsForGuide(guideId: string): Trip[] {
    return this.tripsRepository
      .findByGuide(guideId)
      .filter((t) =>
        [
          TripStatus.PENDING_GUIDE_CONFIRM,
          TripStatus.CONFIRMED,
          TripStatus.STARTED,
          TripStatus.COMPLETED,
          TripStatus.REJECTED_BY_GUIDE,
        ].includes(t.status),
      );
  }

  findAll() {
    return this.tripsRepository.findAll();
  }

  findOne(id: string) {
    const trip = this.tripsRepository.findById(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    return trip;
  }

  findByTraveller(travellerId: string) {
    return this.tripsRepository.findByTraveller(travellerId);
  }

  findByGuide(guideId: string) {
    return this.tripsRepository.findByGuide(guideId);
  }

  update(id: string, dto: UpdateTripDto, actor?: { userId?: string; role?: string }) {
    const trip = this.findOne(id);
    const plan = this.plansRepository.findById(trip.planId);
    if (!plan) throw new NotFoundException(`Plan ${trip.planId} not found`);

    if (dto.status) {
      this.assertStatusTransition(trip, dto.status, actor);
    }

    if (dto.guideId && actor?.role === 'guide' && dto.guideId !== actor.userId) {
      throw new ForbiddenException('Guide can only assign their own guideId');
    }

    const itinerary = dto.itinerary
      ? mergeStructuredItineraryPatch(trip.itinerary, dto.itinerary)
      : trip.itinerary;

    const updated = this.tripsRepository.update(id, {
      guideId: dto.guideId ?? trip.guideId,
      status: dto.status ?? trip.status,
      itinerary,
      totalAmount: dto.totalAmount ?? this.calculateTotalAmount(itinerary, plan.pricePerPerson),
    });

    if (!updated) throw new NotFoundException(`Trip ${id} not found`);
    return updated;
  }

  assignGuide(tripId: string, guideId: string): Trip {
    const trip = this.findOne(tripId);
    const updated = this.tripsRepository.update(trip.id, {
      guideId,
      status: TripStatus.CONFIRMED,
    });
    if (!updated) throw new NotFoundException(`Trip ${tripId} not found`);
    return updated;
  }

  updateTracking(
    id: string,
    dto: UpdateTripTrackingDto,
    actor?: { userId?: string; role?: string },
  ) {
    const trip = this.findOne(id);
    const role = actor?.role;
    const isAdmin = role === 'superadmin' || role === 'nontechadmin';
    const isAssignedGuide = role === 'guide' && trip.guideId === actor?.userId;

    if (!isAdmin && !isAssignedGuide) {
      throw new ForbiddenException('Only the assigned guide can update tracking');
    }

    const trackingStatus = dto.trackingStatus ?? trip.trackingStatus;
    const progressPercentage =
      trackingStatus === TripTrackingStatus.COMPLETED
        ? 100
        : dto.progressPercentage ?? trip.progressPercentage;

    const status =
      trackingStatus === TripTrackingStatus.COMPLETED
        ? TripStatus.COMPLETED
        : trackingStatus === TripTrackingStatus.ONGOING
          ? TripStatus.STARTED
          : trip.status;

    const updated = this.tripsRepository.update(id, {
      status,
      currentDay: dto.currentDay ?? trip.currentDay,
      currentStop: dto.currentStop ?? trip.currentStop,
      currentLocation: dto.currentLocation ?? trip.currentLocation,
      trackingStatus,
      progressPercentage,
      lastUpdatedAt: new Date().toISOString(),
    });

    if (!updated) throw new NotFoundException(`Trip ${id} not found`);
    return updated;
  }

  experienceExistsOnTrip(tripId: string, experienceId: string): boolean {
    const trip = this.findOne(tripId);
    return trip.itinerary.days.some((day) =>
      day.experiences.some((experience) => experience.experienceId === experienceId),
    );
  }

  remove(id: string) {
    const deleted = this.tripsRepository.delete(id);
    if (!deleted) throw new NotFoundException(`Trip ${id} not found`);
    return { message: `Trip ${id} deleted` };
  }

  private calculateTotalAmount(itinerary: StructuredItinerary, basePrice: number): number {
    const flightAmount = itinerary.day1.flight ? 12000 : 0;
    const hotelAmount = itinerary.day1.hotel ? 18000 : 0;
    const experienceAmount = itinerary.days.reduce(
      (sum, day) => sum + day.experiences.length * 3500,
      0,
    );

    return Math.max(basePrice, flightAmount + hotelAmount + experienceAmount);
  }

  private assertStatusTransition(
    trip: Trip,
    status: TripStatus,
    actor?: { userId?: string; role?: string },
  ) {
    if (status === trip.status) return;

    const allowedTransitions: Record<TripStatus, TripStatus[]> = {
      [TripStatus.DRAFT]: [TripStatus.CONFIRMED],
      [TripStatus.PENDING_GUIDE_CONFIRM]: [],
      [TripStatus.CONFIRMED]: [TripStatus.STARTED],
      [TripStatus.STARTED]: [TripStatus.COMPLETED],
      [TripStatus.COMPLETED]: [],
      [TripStatus.REJECTED_BY_GUIDE]: [],
    };

    if (!allowedTransitions[trip.status].includes(status)) {
      throw new BadRequestException(
        `Invalid trip status transition from ${trip.status} to ${status}`,
      );
    }

    if (
      status === TripStatus.CONFIRMED &&
      (actor?.role === 'traveller' || actor?.role === 'TRAVELLER')
    ) {
      if (trip.travellerId !== actor.userId) {
        throw new ForbiddenException('Traveller can only confirm their own trip');
      }
      return;
    }

    if (status === TripStatus.STARTED || status === TripStatus.COMPLETED) {
      if (actor?.role !== 'guide') {
        throw new ForbiddenException('Only guides can progress assigned trips');
      }
      if (!trip.guideId || trip.guideId !== actor.userId) {
        throw new ForbiddenException('Guide is not assigned to this trip');
      }
    }
  }
}
