import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GuideApplicationsRepository } from '../guide-applications/guide-applications.repository';
import { PlansRepository } from '../plans/plans.repository';
import { ExperienceBookingStatus } from '../experience-bookings/entities/experience-booking.entity';
import { ExperienceBookingsRepository } from '../experience-bookings/experience-bookings.repository';
import { ExperiencesRepository } from '../experiences/experiences.repository';
import { GuideRepository } from '../guide/guide.repository';
import { ReviewsRepository } from '../reviews/reviews.repository';
import { ReviewTargetType } from '../reviews/dto/create-review.dto';
import { GUIDE_BLOCKING_STATUSES, tripDateRange } from '../trips/trip-dates';
import { TripsRepository } from '../trips/trips.repository';

type Actor = { userId?: string; role?: string };

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
const day = (v: unknown) => String(v ?? '').slice(0, 10);

/**
 * Optional guide for an experience booking. The traveller is asked after booking whether they
 * want one. Guides offered: approved by the regional NTA for a plan in the experience's region,
 * free on the session date, and not already declined for this booking.
 */
@Injectable()
export class ExperienceGuidesService {
  constructor(
    private readonly bookings: ExperienceBookingsRepository,
    private readonly experiences: ExperiencesRepository,
    private readonly applications: GuideApplicationsRepository,
    private readonly plans: PlansRepository,
    private readonly guides: GuideRepository,
    private readonly reviews: ReviewsRepository,
    private readonly trips: TripsRepository,
  ) {}

  private ownBooking(id: string, actor?: Actor) {
    const booking = this.bookings.findById(id);
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    if (actor?.role === 'traveller' && booking.travellerId !== actor.userId) {
      throw new ForbiddenException('You can only manage guides on your own bookings.');
    }
    return booking;
  }

  /** Is the guide already committed on this date (confirmed trip or confirmed experience)? */
  private isBusy(guideId: string, date: string, ignoreBookingId?: string): boolean {
    const onTrip = this.trips
      .findByGuide(guideId)
      .filter((t) => GUIDE_BLOCKING_STATUSES.includes(t.status))
      .some((t) => {
        const { start, end } = tripDateRange(t);
        return Boolean(start && end && start <= date && date <= end);
      });
    if (onTrip) return true;
    return this.bookings
      .findAll()
      .some(
        (b) =>
          b.id !== ignoreBookingId &&
          b.guideId === guideId &&
          b.guideStatus === 'confirmed' &&
          b.status !== ExperienceBookingStatus.CANCELLED &&
          day(b.date) === date,
      );
  }

  availableGuides(bookingId: string, actor?: Actor) {
    const booking = this.ownBooking(bookingId, actor);
    const experience = this.experiences.findById(booking.experienceId);
    if (!experience) throw new NotFoundException('Experience not found');
    const date = day(booking.date);
    const declined = new Set(booking.declinedGuideIds ?? []);

    // Cheapest approved price per guide across plans in the experience's region.
    const priceByGuide = new Map<string, number>();
    for (const app of this.applications.findAll()) {
      if (app.status !== 'accepted') continue;
      const plan = this.plans.findById(app.planId);
      if (!plan || norm(plan.destination) !== norm(experience.destination)) continue;
      const current = priceByGuide.get(app.guideId);
      if (current === undefined || app.guidePricePerPerson < current) {
        priceByGuide.set(app.guideId, app.guidePricePerPerson);
      }
    }

    return [...priceByGuide.entries()]
      .filter(([guideId]) => !declined.has(guideId) && !this.isBusy(guideId, date, booking.id))
      .flatMap(([guideId, pricePerPerson]) => {
        const guide = this.guides.findById(guideId);
        if (!guide) return [];
        const { rating, reviewCount } = this.reviews.summaryFor(ReviewTargetType.GUIDE, guideId);
        return [
          {
            guideId,
            name: `${guide.fname} ${guide.lname}`.trim(),
            title: guide.prof_title,
            location: guide.location,
            yearsExp: guide.years_exp,
            languages: guide.lang_spoken,
            bio: guide.bio,
            pricePerPerson,
            guideFee: pricePerPerson * booking.participants,
            rating,
            reviewCount,
          },
        ];
      })
      .sort((a, b) => b.rating - a.rating || a.pricePerPerson - b.pricePerPerson);
  }

  requestGuide(bookingId: string, guideId: string, actor?: Actor) {
    const booking = this.ownBooking(bookingId, actor);
    if (booking.status !== ExperienceBookingStatus.CONFIRMED) {
      throw new BadRequestException('A guide can only be added to a confirmed booking.');
    }
    if (day(booking.date) < new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException('This session has already passed.');
    }
    if (booking.guideId && booking.guideStatus !== 'declined') {
      throw new BadRequestException('This booking already has a guide request. Cancel it first.');
    }
    const offered = this.availableGuides(bookingId, actor).find((g) => g.guideId === guideId);
    if (!offered) {
      throw new BadRequestException('This guide is not available for your session. Please choose another.');
    }
    this.bookings.clearGuide(booking.id);
    return this.bookings.patch(booking.id, {
      guideId,
      guideName: offered.name,
      guideStatus: 'requested',
      guidePricePerPerson: offered.pricePerPerson,
      guideFee: offered.guideFee,
      guideNote: '',
    });
  }

  cancelRequest(bookingId: string, actor?: Actor) {
    const booking = this.ownBooking(bookingId, actor);
    if (booking.guideStatus !== 'requested') {
      throw new BadRequestException('There is no pending guide request to cancel.');
    }
    this.bookings.clearGuide(booking.id);
    return this.bookings.patch(booking.id, { guideNote: '' });
  }

  // ── Guide side ──
  jobsForGuide(guideId: string | undefined) {
    if (!guideId) throw new ForbiddenException('Guide id missing');
    return this.bookings
      .findAll()
      .filter((b) => b.guideId === guideId || (b.declinedGuideIds ?? []).includes(guideId))
      .map((b) => {
        const mine = b.guideId === guideId;
        const experience = this.experiences.findById(b.experienceId);
        return {
          id: b.id,
          kind: 'experience' as const,
          travellerId: b.travellerId,
          guestName: b.guestName,
          participants: b.participants,
          date: b.date,
          title: experience?.title ?? b.experienceId,
          destination: experience?.destination ?? '',
          guidePricePerPerson: b.guidePricePerPerson,
          guideFee: b.guideFee,
          bookingStatus: b.status,
          // Same vocabulary the guide dashboard already uses for trip assignments.
          status: !mine
            ? 'rejected_by_guide'
            : b.status === ExperienceBookingStatus.CANCELLED
              ? 'cancelled'
              : b.guideStatus === 'confirmed'
                ? 'confirmed'
                : 'pending_guide_confirm',
        };
      });
  }

  confirm(bookingId: string, guideId: string | undefined) {
    const booking = this.guideBooking(bookingId, guideId);
    if (booking.guideStatus !== 'requested') {
      throw new BadRequestException('Only a pending request can be confirmed.');
    }
    if (this.isBusy(guideId!, day(booking.date), booking.id)) {
      throw new BadRequestException('You already have a confirmed job on that date. Decline this request instead.');
    }
    const updated = this.bookings.patch(booking.id, { guideStatus: 'confirmed', guideNote: '' });

    // Other travellers' pending requests for this guide on the same date can no longer be honoured.
    for (const other of this.bookings.findAll()) {
      if (
        other.id !== booking.id &&
        other.guideId === guideId &&
        other.guideStatus === 'requested' &&
        day(other.date) === day(booking.date)
      ) {
        this.decline(other.id, guideId!, 'Guide is no longer available on your session date.');
      }
    }
    return updated;
  }

  reject(bookingId: string, guideId: string | undefined) {
    const booking = this.guideBooking(bookingId, guideId);
    if (booking.guideStatus !== 'requested' && booking.guideStatus !== 'confirmed') {
      throw new BadRequestException('There is nothing to decline.');
    }
    return this.decline(booking.id, guideId!, 'Guide not confirmed — the guide could not take this session.');
  }

  private guideBooking(bookingId: string, guideId: string | undefined) {
    const booking = this.bookings.findById(bookingId);
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (!guideId || booking.guideId !== guideId) {
      throw new ForbiddenException('You are not assigned to this booking');
    }
    return booking;
  }

  private decline(bookingId: string, guideId: string, note: string) {
    const booking = this.bookings.findById(bookingId)!;
    const declined = new Set(booking.declinedGuideIds ?? []);
    declined.add(guideId);
    this.bookings.clearGuide(bookingId);
    return this.bookings.patch(bookingId, {
      guideStatus: 'declined',
      guideNote: note,
      declinedGuideIds: [...declined],
    });
  }
}
