import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GuideApplicationsRepository } from './guide-applications.repository';
import { CreateGuideApplicationDto } from './dto/create-guide-application.dto';
import { DecideGuideApplicationDto } from './dto/decide-guide-application.dto';
import { GuideApplication, GuideApplicationStatus } from './entities/guide-application.entity';
import { GuideRepository } from '../guide/guide.repository';
import { PlansRepository } from '../plans/plans.repository';
import { TripsService } from '../trips/trips.service';
import { ReviewsRepository } from '../reviews/reviews.repository';
import { ReviewTargetType } from '../reviews/dto/create-review.dto';
import { ExperiencesRepository } from '../experiences/experiences.repository';
import { ExperienceBookingsRepository } from '../experience-bookings/experience-bookings.repository';
import { ExperienceBookingStatus } from '../experience-bookings/entities/experience-booking.entity';

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
// "Kerala" matches "Kerala"; tolerant of a city-level value ("Kochi, Kerala") on either side.
const sameArea = (a: unknown, b: unknown) => {
  const x = norm(a);
  const y = norm(b);
  return Boolean(x) && Boolean(y) && (x === y || x.includes(y) || y.includes(x));
};

type Actor = { userId?: string; role?: string; region?: string };

@Injectable()
export class GuideApplicationsService {
  constructor(
    private readonly repository: GuideApplicationsRepository,
    private readonly guideRepository: GuideRepository,
    private readonly plansRepository: PlansRepository,
    private readonly tripsService: TripsService,
    private readonly reviewsRepository: ReviewsRepository,
    private readonly experiencesRepository: ExperiencesRepository,
    private readonly experienceBookingsRepository: ExperienceBookingsRepository,
  ) {}

  create(guideId: string | undefined, dto: CreateGuideApplicationDto) {
    if (!guideId) throw new ForbiddenException('x-user-id header is required for GUIDE');
    if (Boolean(dto.planId) === Boolean(dto.experienceId)) {
      throw new BadRequestException('Provide exactly one of planId or experienceId.');
    }

    const guide = this.guideRepository.findById(guideId);
    if (!guide) {
      throw new BadRequestException('Complete your guide profile before applying to guide.');
    }

    if (dto.planId) {
      const plan = this.plansRepository.findById(dto.planId);
      if (!plan) throw new NotFoundException(`Plan ${dto.planId} not found`);
      // Cross-data validation: a guide can only lead plans in the region they are based in.
      if (!sameArea(guide.location, plan.destination)) {
        throw new BadRequestException(
          `You are based in '${guide.location}' and can only apply to plans in your region (this plan is in '${plan.destination}').`,
        );
      }
      if (this.repository.existsActive(guideId, dto.planId)) {
        throw new BadRequestException('You have already applied for this plan');
      }
      // The regional NTA reviews it; the guide is not selectable by travellers until it is accepted.
      return this.repository.create({
        guideId,
        planId: plan.id,
        guidePricePerPerson: dto.guidePricePerPerson,
        status: GuideApplicationStatus.PENDING,
        autoDecisionReason: null,
      });
    }

    const experience = this.experiencesRepository.findById(dto.experienceId!);
    if (!experience) throw new NotFoundException(`Experience ${dto.experienceId} not found`);
    if (!sameArea(guide.location, experience.destination)) {
      throw new BadRequestException(
        `You are based in '${guide.location}' and can only apply to experiences in your region (this experience is in '${experience.destination}').`,
      );
    }
    if (this.repository.existsActiveForExperience(guideId, experience.id)) {
      throw new BadRequestException('You have already applied for this experience');
    }
    // Only a guide who applied-and-was-approved for THIS experience is ever offered to a
    // traveller booking it — see ExperienceGuidesService#availableGuides.
    return this.repository.create({
      guideId,
      experienceId: experience.id,
      guidePricePerPerson: dto.guidePricePerPerson,
      status: GuideApplicationStatus.PENDING,
      autoDecisionReason: null,
    });
  }

  findForGuide(requestedGuideId: string, actingGuideId: string | undefined) {
    if (requestedGuideId !== actingGuideId) {
      throw new ForbiddenException('You can only view your own applications.');
    }
    return this.repository.findByGuideId(requestedGuideId).map((app) => this.toReviewView(app));
  }

  /** Applications for plans/experiences in the NTA's region (superadmin sees all). */
  findForReviewer(actor?: Actor) {
    const isNta = actor?.role === 'nontechadmin';
    const region = norm(actor?.region);
    return this.repository
      .findAll()
      .map((app) => this.toReviewView(app))
      .filter((view) => !isNta || (region && norm(view.plan?.destination ?? view.experience?.destination) === region))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  decide(id: string, dto: DecideGuideApplicationDto, actor?: Actor) {
    const application = this.repository.findById(id);
    if (!application) throw new NotFoundException(`Application ${id} not found`);

    const plan = application.planId ? this.plansRepository.findById(application.planId) : undefined;
    const experience = application.experienceId ? this.experiencesRepository.findById(application.experienceId) : undefined;
    const destination = plan?.destination ?? experience?.destination;
    if (!destination) {
      throw new NotFoundException(
        application.planId ? `Plan ${application.planId} not found` : `Experience ${application.experienceId} not found`,
      );
    }

    if (actor?.role === 'nontechadmin') {
      const region = norm(actor.region);
      if (!region || norm(destination) !== region) {
        throw new ForbiddenException(
          `Cannot decide applications for '${destination}': outside your assigned region '${actor.region ?? ''}'`,
        );
      }
    }

    const next = dto.status as GuideApplicationStatus;
    if (application.status === next) {
      throw new BadRequestException(`Application is already ${next}`);
    }
    if (next === GuideApplicationStatus.ACCEPTED && application.status === GuideApplicationStatus.REJECTED) {
      throw new BadRequestException('A rejected application cannot be re-accepted; the guide must apply again.');
    }
    const reason = (dto.reason ?? '').trim();
    if (next === GuideApplicationStatus.REJECTED && reason.length < 5) {
      throw new BadRequestException('A rejection reason of at least 5 characters is required.');
    }

    if (next === GuideApplicationStatus.REJECTED && application.status === GuideApplicationStatus.ACCEPTED) {
      if (application.planId) {
        // Withdrawing an approval: a guide who already holds confirmed trips on this plan stays
        // put until those are reassigned; open (unconfirmed) requests go back to their travellers.
        const confirmed = this.tripsService.confirmedTripsForGuidePlan(application.guideId, application.planId);
        if (confirmed > 0) {
          throw new BadRequestException(
            `This guide has ${confirmed} confirmed trip(s) on this plan. Resolve those before withdrawing the approval.`,
          );
        }
        this.tripsService.releaseGuideForPlan(application.guideId, application.planId);
      } else if (application.experienceId) {
        const confirmed = this.experienceBookingsRepository
          .findByExperienceIds([application.experienceId])
          .filter(
            (b) =>
              b.guideId === application.guideId &&
              b.guideStatus === 'confirmed' &&
              b.status !== ExperienceBookingStatus.CANCELLED,
          ).length;
        if (confirmed > 0) {
          throw new BadRequestException(
            `This guide has ${confirmed} confirmed session(s) on this experience. Resolve those before withdrawing the approval.`,
          );
        }
        for (const booking of this.experienceBookingsRepository.findByExperienceIds([application.experienceId])) {
          if (booking.guideId === application.guideId && booking.guideStatus === 'requested') {
            const declined = new Set(booking.declinedGuideIds ?? []);
            declined.add(application.guideId);
            this.experienceBookingsRepository.clearGuide(booking.id);
            this.experienceBookingsRepository.patch(booking.id, {
              guideStatus: 'declined',
              guideNote: 'Guide is no longer approved for this experience.',
              declinedGuideIds: [...declined],
            });
          }
        }
      }
    }

    const updated = this.repository.update(id, {
      status: next,
      autoDecisionReason:
        next === GuideApplicationStatus.ACCEPTED
          ? reason || `Approved by ${actor?.region ?? 'NTA'} NTA.`
          : reason,
      decidedBy: actor?.userId,
      decidedAt: new Date(),
    });
    return this.toReviewView(updated!);
  }

  private toReviewView(app: GuideApplication) {
    const guide = this.guideRepository.findById(app.guideId);
    const plan = app.planId ? this.plansRepository.findById(app.planId) : undefined;
    const experience = app.experienceId ? this.experiencesRepository.findById(app.experienceId) : undefined;
    const { rating, reviewCount } = this.reviewsRepository.summaryFor(ReviewTargetType.GUIDE, app.guideId);
    return {
      ...app,
      guide: guide
        ? {
            userId: guide.userId,
            name: `${guide.fname} ${guide.lname}`.trim(),
            email: guide.email,
            phone: guide.phone,
            location: guide.location,
            yearsExp: guide.years_exp,
            languages: guide.lang_spoken,
            certifications: guide.certifications,
            bio: guide.bio,
            rating,
            reviewCount,
          }
        : null,
      plan: plan
        ? { id: plan.id, title: plan.title, destination: plan.destination, pricePerPerson: plan.pricePerPerson }
        : null,
      experience: experience
        ? { id: experience.id, title: experience.title, destination: experience.destination, price: experience.price }
        : null,
    };
  }
}
