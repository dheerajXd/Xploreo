import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GuideApplication, GuideApplicationStatus } from './entities/guide-application.entity';

@Injectable()
export class GuideApplicationsRepository {
  private readonly applications: GuideApplication[] = [
    {
      id: 'guide-app-1',
      guideId: 'G001',
      planId: 'plan-1',
      guidePricePerPerson: 1800,
      status: GuideApplicationStatus.ACCEPTED,
      autoDecisionReason: "Auto-accepted: Guide location 'Kerala' matches plan destination 'Kerala'.",
      createdAt: new Date('2026-04-01'),
      updatedAt: new Date('2026-04-01'),
    },
  ];

  create(data: {
    guideId: string;
    planId: string;
    guidePricePerPerson: number;
    status: GuideApplicationStatus;
    autoDecisionReason: string;
  }): GuideApplication {
    const now = new Date();
    const application: GuideApplication = {
      id: randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.applications.push(application);
    return { ...application };
  }

  findAll(): GuideApplication[] {
    return this.applications.map((a) => ({ ...a }));
  }

  findByGuideId(guideId: string): GuideApplication[] {
    return this.applications
      .filter((a) => a.guideId === guideId)
      .map((a) => ({ ...a }));
  }

  existsActive(guideId: string, planId: string): boolean {
    return this.applications.some(
      (a) =>
        a.guideId === guideId &&
        a.planId === planId &&
        a.status !== GuideApplicationStatus.REJECTED,
    );
  }
}
