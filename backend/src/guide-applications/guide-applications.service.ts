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
  ) {}

  create(guideId: string | undefined, dto: CreateGuideApplicationDto) {
    if (!guideId) throw new ForbiddenException('x-user-id header is required for GUIDE');

    const plan = this.plansRepository.findById(dto.planId);
    if (!plan) throw new NotFoundException(`Plan ${dto.planId} not found`);

    const guide = this.guideRepository.findById(guideId);
    if (!guide) {
      throw new BadRequestException('Complete your guide profile before applying to plans.');
    }
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

  findForGuide(requestedGuideId: string, actingGuideId: string | undefined) {
    if (requestedGuideId !== actingGuideId) {
      throw new ForbiddenException('You can only view your own applications.');
    }
    return this.repository.findByGuideId(requestedGuideId);
  }

  /** Applications for plans in the NTA's region (superadmin sees all), with guide + plan details. */
  findForReviewer(actor?: Actor) {
    const isNta = actor?.role === 'nontechadmin';
    const region = norm(actor?.region);
    return this.repository
      .findAll()
      .map((app) => this.toReviewView(app))
      .filter((view) => !isNta || (region && norm(view.plan?.destination) === region))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  decide(id: string, dto: DecideGuideApplicationDto, actor?: Actor) {
    const application = this.repository.findById(id);
    if (!application) throw new NotFoundException(`Application ${id} not found`);
    const plan = this.plansRepository.findById(application.planId);
    if (!plan) throw new NotFoundException(`Plan ${application.planId} not found`);

    if (actor?.role === 'nontechadmin') {
      const region = norm(actor.region);
      if (!region || norm(plan.destination) !== region) {
        throw new ForbiddenException(
          `Cannot decide applications for '${plan.destination}': outside your assigned region '${actor.region ?? ''}'`,
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
      // Withdrawing an approval: a guide who already holds confirmed trips on this plan stays put
      // until those are reassigned; open (unconfirmed) requests go back to their travellers.
      const confirmed = this.tripsService.confirmedTripsForGuidePlan(application.guideId, application.planId);
      if (confirmed > 0) {
        throw new BadRequestException(
          `This guide has ${confirmed} confirmed trip(s) on this plan. Resolve those before withdrawing the approval.`,
        );
      }
      this.tripsService.releaseGuideForPlan(application.guideId, application.planId);
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
    const plan = this.plansRepository.findById(app.planId);
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
    };
  }
}
