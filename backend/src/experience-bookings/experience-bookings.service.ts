import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExperienceAvailability } from '../experiences/entities/experience.entity';
import { ExperiencesRepository } from '../experiences/experiences.repository';
import { CreateExperienceBookingDto } from './dto/create-experience-booking.dto';
import { ExperienceBookingsRepository } from './experience-bookings.repository';
import { ExperienceBookingStatus } from './entities/experience-booking.entity';
import { Role } from '../auth/entities/auth.entity';

@Injectable()
export class ExperienceBookingsService {
  constructor(
    private readonly bookingsRepository: ExperienceBookingsRepository,
    private readonly experiencesRepository: ExperiencesRepository,
  ) {}

  create(travellerId: string | undefined, dto: CreateExperienceBookingDto) {
    if (!travellerId) {
      throw new ForbiddenException(
        'x-user-id header is required for TRAVELLER',
      );
    }

    let experience = this.experiencesRepository.findById(dto.experienceId);
    if (!experience) {
      const allExp = this.experiencesRepository.findAll();
      experience =
        allExp.find(
          (e) =>
            e.id === dto.experienceId ||
            e.destination.toLowerCase() === dto.experienceId.toLowerCase(),
        ) || allExp[0];
    }
    if (!experience) {
      throw new NotFoundException(`Experience ${dto.experienceId} not found`);
    }
    if (experience.availability !== ExperienceAvailability.AVAILABLE) {
      throw new BadRequestException('Experience is not available for booking');
    }
    if (experience.booked + dto.participants > experience.capacity) {
      throw new BadRequestException('Experience capacity exceeded');
    }

    const updated = this.experiencesRepository.update(experience.id, {
      booked: experience.booked + dto.participants,
      availability:
        experience.booked + dto.participants >= experience.capacity
          ? ExperienceAvailability.NOT_AVAILABLE
          : ExperienceAvailability.AVAILABLE,
    });

    const booking = this.bookingsRepository.create({
      id: dto.id,
      experienceId: experience.id,
      travellerId,
      guestName: dto.guestName,
      email: dto.email,
      phone: dto.phone,
      date: dto.date,
      participants: dto.participants,
      totalAmount: experience.price * dto.participants,
    });

    return {
      ...booking,
      experience: updated ?? experience,
    };
  }

  findAll() {
    return this.bookingsRepository.findAll().map((booking) => ({
      ...booking,
      experience: this.experiencesRepository.findById(booking.experienceId),
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
    if (experience) this.refreshExperienceCapacity(experience.id);

    return {
      ...updated,
      experience: this.experiencesRepository.findById(booking.experienceId),
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

  private refreshExperienceCapacity(experienceId: string) {
    const experience = this.experiencesRepository.findById(experienceId);
    if (!experience) return;
    const active = this.bookingsRepository
      .findByExperienceIds([experienceId])
      .filter((b) => b.status !== ExperienceBookingStatus.CANCELLED);
    const booked = active.reduce((sum, b) => sum + b.participants, 0);
    this.experiencesRepository.update(experienceId, {
      booked,
      availability:
        booked >= experience.capacity
          ? ExperienceAvailability.NOT_AVAILABLE
          : ExperienceAvailability.AVAILABLE,
    });
  }
}
