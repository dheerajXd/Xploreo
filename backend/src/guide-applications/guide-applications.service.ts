import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GuideApplicationsRepository } from './guide-applications.repository';
import { CreateGuideApplicationDto } from './dto/create-guide-application.dto';
import { GuideApplicationStatus } from './entities/guide-application.entity';
import { GuideRepository } from '../guide/guide.repository';
import { PlansRepository } from '../plans/plans.repository';

const sameRegion = (a: string, b: string) =>
  String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

@Injectable()
export class GuideApplicationsService {
  constructor(
    private readonly repository: GuideApplicationsRepository,
    private readonly guideRepository: GuideRepository,
    private readonly plansRepository: PlansRepository,
  ) {}

  create(guideId: string | undefined, dto: CreateGuideApplicationDto) {
    if (!guideId) throw new ForbiddenException('x-user-id header is required for GUIDE');

    const plan = this.plansRepository.findById(dto.planId);
    if (!plan) throw new NotFoundException(`Plan ${dto.planId} not found`);

    if (this.repository.existsActive(guideId, dto.planId)) {
      throw new BadRequestException('You have already applied for this plan');
    }

    const guide = this.guideRepository.findById(guideId);
    // The server decides, not the client: a guide is accepted only for plans in their own region.
    const match = guide ? sameRegion(guide.location, plan.destination) : false;

    return this.repository.create({
      guideId,
      planId: plan.id,
      guidePricePerPerson: dto.guidePricePerPerson,
      status: match ? GuideApplicationStatus.ACCEPTED : GuideApplicationStatus.REJECTED,
      autoDecisionReason: match
        ? `Auto-accepted: Guide location '${guide?.location}' matches plan destination '${plan.destination}'`
        : `Auto-rejected: Guide location '${guide?.location}' does not match plan destination '${plan.destination}'`,
    });
  }

  findForGuide(requestedGuideId: string, actingGuideId: string | undefined) {
    if (requestedGuideId !== actingGuideId) {
      throw new ForbiddenException('You can only view your own applications.');
    }
    return this.repository.findByGuideId(requestedGuideId);
  }
}
