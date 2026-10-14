import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto, ReviewTargetType } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsRepository } from './reviews.repository';
import { HotelsRepository } from '../hotels/hotels.repository';
import { ExperiencesRepository } from '../experiences/experiences.repository';
import { TripsRepository } from '../trips/trips.repository';
import { TripStatus, TripTrackingStatus } from '../trips/entities/trip.entity';
import { Role } from '../auth/entities/auth.entity';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly hotelsRepository: HotelsRepository,
    private readonly experiencesRepository: ExperiencesRepository,
    private readonly tripsRepository: TripsRepository,
  ) {}

  create(dto: CreateReviewDto, authenticatedUserId?: string) {
    const effectiveUserId = (authenticatedUserId || '').trim();
    if (!effectiveUserId) {
      throw new ForbiddenException('x-user-id header is required');
    }
    dto.userId = effectiveUserId;
    const existingReviews = this.reviewsRepository.findAll();

    const matchesUser = (rUserId: string | number) => {
      return String(rUserId).trim().toLowerCase() === effectiveUserId.toLowerCase();
    };

    if (dto.tripId) {
      const trip = this.tripsRepository.findById(dto.tripId);
      if (!trip) {
        throw new NotFoundException(`Trip ${dto.tripId} not found`);
      }
      if (String(trip.travellerId).trim().toLowerCase() !== effectiveUserId.toLowerCase()) {
        throw new BadRequestException('You can only review trips that belong to you');
      }
      const isCompleted =
        trip.status === TripStatus.COMPLETED ||
        trip.trackingStatus === TripTrackingStatus.COMPLETED;
      if (!isCompleted) {
        throw new BadRequestException(
          'Reviews can only be submitted for completed trips',
        );
      }

      // Prevent duplicate reviews per trip
      const duplicate = existingReviews.find(
        (r) => r.tripId === dto.tripId && matchesUser(r.userId),
      );
      if (duplicate) {
        throw new BadRequestException(
          'A review for this trip has already been submitted',
        );
      }
    } else {
      // If tripId is omitted, verify that the traveller has at least one completed trip
      const travellerTrips = this.tripsRepository.findByTraveller(effectiveUserId);
      const completedTrips = travellerTrips.filter(
        (t) =>
          t.status === TripStatus.COMPLETED ||
          t.trackingStatus === TripTrackingStatus.COMPLETED,
      );
      if (completedTrips.length === 0) {
        throw new BadRequestException(
          'Reviews can only be submitted for completed trips',
        );
      }

      // Associate with first unreviewed completed trip or reject duplicate
      const unreviewed = completedTrips.find(
        (t) => !existingReviews.some((r) => r.tripId === t.id && matchesUser(r.userId)),
      );
      if (!unreviewed) {
        throw new BadRequestException(
          'A review for your completed trip has already been submitted',
        );
      }
      dto.tripId = unreviewed.id;
    }

    const review = this.reviewsRepository.create(dto);
    if (review.targetType === ReviewTargetType.HOTEL) {
      this.refreshHotelRating(review.targetId);
    }
    return review;
  }

  // Scoped the same way the client expects: a hotel partner sees reviews only for hotels
  // they own, an experience partner only their experiences, a guide only their own reviews.
  // Everyone else (traveller, superadmin, nontechadmin) sees the full feed.
  findForUser(userId: string | undefined, role: string | undefined, hotelId?: string) {
    if (role === Role.HOTEL) {
      const myHotels = this.hotelsRepository.findByPartnerId(userId ?? '');
      const hotelById = new Map(myHotels.map((h) => [h.id, h]));
      const ids = hotelId ? [hotelId] : myHotels.map((h) => h.id);
      return this.reviewsRepository
        .findByTarget(ReviewTargetType.HOTEL, ids)
        .map((r) => ({
          ...r,
          authorName: r.authorName ?? `Traveller ${r.userId}`,
          hotelName: hotelById.get(r.targetId)?.name ?? '',
        }));
    }
    if (role === Role.EXPERIENCE) {
      const mine = this.experiencesRepository
        .findAll()
        .filter((e) => e.partnerId === userId)
        .map((e) => e.id);
      return this.reviewsRepository.findByTarget(ReviewTargetType.EXPERIENCE, mine);
    }
    if (role === Role.GUIDE) {
      return this.reviewsRepository.findByTarget(ReviewTargetType.GUIDE, userId ? [userId] : []);
    }
    return this.reviewsRepository.findAll();
  }

  findAll() {
    return this.reviewsRepository.findAll();
  }

  findOne(id: number) {
    const review = this.reviewsRepository.findById(id);
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    return review;
  }

  update(id: number, dto: UpdateReviewDto) {
    const updated = this.reviewsRepository.update(id, dto);
    if (!updated) throw new NotFoundException(`Review ${id} not found`);
    if (updated.targetType === ReviewTargetType.HOTEL) this.refreshHotelRating(updated.targetId);
    return updated;
  }

  remove(id: number) {
    const review = this.reviewsRepository.findById(id);
    const deleted = this.reviewsRepository.delete(id);
    if (!deleted) throw new NotFoundException(`Review ${id} not found`);
    if (review?.targetType === ReviewTargetType.HOTEL) this.refreshHotelRating(review.targetId);
    return { message: `Review ${id} deleted` };
  }

  private refreshHotelRating(hotelId: string) {
    const reviews = this.reviewsRepository.findByTarget(ReviewTargetType.HOTEL, [hotelId]);
    const rating = reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;
    this.hotelsRepository.setRating(hotelId, rating, reviews.length);
  }
}
