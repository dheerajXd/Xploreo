import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExperienceAvailability } from '../experiences/entities/experience.entity';
import { ExperiencesRepository } from '../experiences/experiences.repository';
import { GuideRepository } from '../guide/guide.repository';
import { CreateExperienceBookingDto } from './dto/create-experience-booking.dto';
import { ExperienceBookingsRepository } from './experience-bookings.repository';
import { ExperienceBooking, ExperienceBookingStatus } from './entities/experience-booking.entity';
import { Role } from '../auth/entities/auth.entity';
import { withTaxes } from '../common/utils/pricing';

const todayIso = () => new Date().toISOString().slice(0, 10);

// Host: CONFIRMED -> CHECKED_IN -> END_REQUESTED -> traveller COMPLETED. A booking can only be
// cancelled before check-in; finished and cancelled bookings are final.
const ALLOWED_TRANSITIONS: Record<ExperienceBookingStatus, ExperienceBookingStatus[]> = {
  [ExperienceBookingStatus.CONFIRMED]: [ExperienceBookingStatus.CHECKED_IN, ExperienceBookingStatus.CANCELLED],
  [ExperienceBookingStatus.CHECKED_IN]: [ExperienceBookingStatus.END_REQUESTED, ExperienceBookingStatus.COMPLETED],
  [ExperienceBookingStatus.END_REQUESTED]: [ExperienceBookingStatus.COMPLETED],
  [ExperienceBookingStatus.COMPLETED]: [],
  [ExperienceBookingStatus.CANCELLED]: [],
};

@Injectable()
export class ExperienceBookingsService {
  constructor(
    private readonly bookingsRepository: ExperienceBookingsRepository,
    private readonly experiencesRepository: ExperiencesRepository,
    private readonly guideRepository: GuideRepository,
  ) {}

  // Once a guideId is attached to a booking (the traveller legitimately picked that guide),
  // expose their contact info on the booking itself — bypasses TravellerService's stricter
  // contact-redaction rule, which only knows about Trip relationships, not Experience bookings.
  private guideContactFor(booking: ExperienceBooking) {
    if (!booking.guideId) return undefined;
    const guide = this.guideRepository.findById(booking.guideId);
    if (!guide) return undefined;
    return {
      userId: guide.userId,
      name: `${guide.fname} ${guide.lname}`.trim(),
      phone: guide.phone,
      email: guide.email,
      profTitle: guide.prof_title,
      yearsExp: guide.years_exp,
      languages: guide.lang_spoken,
      bio: guide.bio,
    };
  }

  create(travellerId: string | undefined, dto: CreateExperienceBookingDto) {
    if (!travellerId) {
      throw new ForbiddenException(
        'x-user-id header is required for TRAVELLER',
      );
    }

    const experience = this.experiencesRepository.findById(dto.experienceId);
    if (!experience) {
      throw new NotFoundException(`Experience ${dto.experienceId} not found`);
    }
    if (experience.availability !== ExperienceAvailability.AVAILABLE) {
      throw new BadRequestException('Experience is not available for booking');
    }

    const date = String(dto.date).slice(0, 10);
    if (date < todayIso()) {
      throw new BadRequestException('Experiences cannot be booked for a past date');
    }
    // Capacity is per session (per date): a booking needs a scheduled session with room left,
    // checked against that specific slot's own capacity, never the experience-wide aggregate.
    let sessionCapacity = experience.capacity;
    if (experience.slots?.length) {
      const slot = experience.slots.find((s) => String(s.date).slice(0, 10) === date);
      if (!slot) {
        throw new BadRequestException(`No session of this experience is scheduled on ${date}`);
      }
      sessionCapacity = slot.capacity;
    }
    const left = sessionCapacity - this.activeParticipantsOn(experience.id, date);
    if (left <= 0) {
      throw new BadRequestException(`This experience is fully booked on ${date}`);
    }
    if (dto.participants > left) {
      throw new BadRequestException(`Only ${left} spot(s) left on ${date}`);
    }
    const duplicate = this.bookingsRepository
      .findByTravellerId(travellerId)
      .some(
        (b) =>
          b.experienceId === experience.id &&
          String(b.date).slice(0, 10) === date &&
          b.status !== ExperienceBookingStatus.CANCELLED,
      );
    if (duplicate) {
      throw new BadRequestException('You already have a booking for this experience on that date');
    }

    // Price x guests, plus taxes & fees (the figure the traveller pays at checkout).
    const pricing = withTaxes(experience.price * dto.participants);

    const booking = this.bookingsRepository.create({
      id: dto.id,
      experienceId: experience.id,
      travellerId,
      guestName: dto.guestName,
      email: dto.email,
      phone: dto.phone,
      date: dto.date,
      participants: dto.participants,
      subtotal: pricing.subtotal,
      taxesAndFees: pricing.taxesAndFees,
      totalAmount: pricing.total,
    });

    this.syncExperience(experience.id);

    return {
      ...booking,
      experience: this.experiencesRepository.findById(experience.id) ?? experience,
      guide: this.guideContactFor(booking),
    };
  }

  findAll() {
    return this.bookingsRepository.findAll().map((booking) => ({
      ...booking,
      experience: this.experiencesRepository.findById(booking.experienceId),
      guide: this.guideContactFor(booking),
    }));
  }

  findForTraveller(travellerId: string | undefined) {
    if (!travellerId) {
      throw new ForbiddenException(
        'x-user-id header is required for TRAVELLER',
      );
    }

    return this.bookingsRepository
      .findByTravellerId(travellerId)
      .map((booking) => ({
        ...booking,
        experience: this.experiencesRepository.findById(booking.experienceId),
        guide: this.guideContactFor(booking),
      }));
  }

  findForPartner(partnerId: string | undefined) {
    if (!partnerId) {
      throw new ForbiddenException(
        'x-user-id header is required for EXPERIENCE_PARTNER',
      );
    }

    const partnerExperiences =
      this.experiencesRepository.findByPartnerId(partnerId);
    const experienceById = new Map(
      partnerExperiences.map((experience) => [experience.id, experience]),
    );

    return this.bookingsRepository
      .findByExperienceIds(
        partnerExperiences.map((experience) => experience.id),
      )
      .map((booking) => ({
        ...booking,
        experience: experienceById.get(booking.experienceId),
      }));
  }

  updateStatus(
    id: string,
    status: ExperienceBookingStatus,
    actor?: { userId?: string; role?: string },
  ) {
    const booking = this.bookingsRepository.findById(id);
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    const experience = this.experiencesRepository.findById(booking.experienceId);

    if (status !== booking.status && !ALLOWED_TRANSITIONS[booking.status].includes(status)) {
      throw new BadRequestException(
        `A ${booking.status.toLowerCase().replace('_', ' ')} booking cannot become ${status.toLowerCase().replace('_', ' ')}`,
      );
    }

    if (status === ExperienceBookingStatus.COMPLETED) {
      if (actor?.role !== Role.TRAVELLER || booking.travellerId !== actor.userId) {
        throw new ForbiddenException('Only the traveller can complete the booking.');
      }
    } else if (status === ExperienceBookingStatus.CANCELLED) {
      const isTraveller = actor?.role === Role.TRAVELLER && booking.travellerId === actor.userId;
      const isHost = actor?.role === Role.EXPERIENCE && experience?.partnerId === actor.userId;
      if (!isTraveller && !isHost) {
        throw new ForbiddenException('Not authorized to cancel this booking.');
      }
    } else if (actor?.role !== Role.EXPERIENCE || !experience || experience.partnerId !== actor.userId) {
      throw new ForbiddenException('Not authorized to update this booking status.');
    }

    const updated = this.bookingsRepository.setStatus(id, status);
    if (experience) this.syncExperience(experience.id);

    return {
      ...updated,
      experience: this.experiencesRepository.findById(booking.experienceId),
      guide: updated ? this.guideContactFor(updated) : undefined,
    };
  }

  // GET /experience-bookings/earnings — everything here is computed live from real bookings.
  earningsForPartner(partnerId: string | undefined, days: number | 'all') {
    if (!partnerId) throw new ForbiddenException('x-user-id header is required for PARTNER');
    const myExperiences = this.experiencesRepository.findByPartnerId(partnerId);
    const experienceById = new Map(myExperiences.map((e) => [e.id, e]));
    let bookings = this.bookingsRepository.findByExperienceIds(myExperiences.map((e) => e.id));

    if (days !== 'all') {
      const cutoff = Date.now() - days * 86_400_000;
      bookings = bookings.filter((b) => new Date(b.createdAt).getTime() >= cutoff);
    }

    const refunded = bookings.filter((b) => b.status === ExperienceBookingStatus.CANCELLED);
    const earning = bookings.filter((b) => b.status !== ExperienceBookingStatus.CANCELLED);

    const gross = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const net = earning.reduce((sum, b) => sum + b.totalAmount, 0);
    const refundedAmount = refunded.reduce((sum, b) => sum + b.totalAmount, 0);
    const avgBookingNet = earning.length ? Math.round(net / earning.length) : 0;

    const byExpMap = new Map<string, number>();
    earning.forEach((b) => byExpMap.set(b.experienceId, (byExpMap.get(b.experienceId) || 0) + b.totalAmount));
    const byExperience = [...byExpMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([experienceId, value]) => ({
        experienceId,
        title: experienceById.get(experienceId)?.title ?? '',
        net: value,
        sharePercent: net ? Math.round((value / net) * 100) : 0,
      }));
    const topExperience = byExperience[0]?.title ?? null;

    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const byDay = new Map<string, number>();
    bookings.forEach((b) => {
      const day = DAY_NAMES[new Date(b.date).getDay()];
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });
    const bestDay = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const totalCapacity = myExperiences.reduce((sum, e) => sum + e.capacity, 0);
    const totalBooked = myExperiences.reduce((sum, e) => sum + e.booked, 0);
    const utilizationPercent = totalCapacity ? Math.round((totalBooked / totalCapacity) * 100) : 0;
    const cancelRate = bookings.length ? Math.round((refunded.length / bookings.length) * 100) : 0;
    const refundPercent = gross ? Math.round((refundedAmount / gross) * 100) : 0;

    const statusBucket = (status: ExperienceBookingStatus) =>
      status === ExperienceBookingStatus.COMPLETED
        ? 'completed'
        : status === ExperienceBookingStatus.CANCELLED
          ? 'refunded'
          : 'pending';

    const transactions = [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((b) => ({
        bookingId: b.id,
        guestName: b.guestName,
        title: experienceById.get(b.experienceId)?.title ?? '',
        net: b.totalAmount,
        date: b.date,
        status: statusBucket(b.status),
      }));

    return {
      summary: {
        gross,
        net,
        refunded: refundedAmount,
        avgBookingNet,
        topExperience,
        bestDay,
        utilizationPercent,
        cancelRate,
        refundPercent,
      },
      byExperience,
      transactions,
    };
  }

  private activeParticipantsOn(experienceId: string, date: string): number {
    return this.bookingsRepository
      .findByExperienceIds([experienceId])
      .filter((b) => b.status !== ExperienceBookingStatus.CANCELLED && String(b.date).slice(0, 10) === date)
      .reduce((sum, b) => sum + b.participants, 0);
  }

  // Keeps each session's booked/available figures (and the headline "booked" for the next session)
  // equal to what the bookings say. The partner's own availability switch is never touched here.
  private syncExperience(experienceId: string) {
    const experience = this.experiencesRepository.findById(experienceId);
    if (!experience) return;
    const slots = (experience.slots ?? []).map((slot) => {
      const booked = this.activeParticipantsOn(experienceId, String(slot.date).slice(0, 10));
      return { ...slot, booked, available: booked < slot.capacity };
    });
    const today = todayIso();
    const next = [...slots]
      .filter((slot) => String(slot.date).slice(0, 10) >= today)
      .sort((x, y) => String(x.date).localeCompare(String(y.date)))[0];
    this.experiencesRepository.update(experienceId, {
      slots,
      booked: next ? next.booked : 0,
    });
  }
}
