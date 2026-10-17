import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { loadSeedData } from '../common/utils/seed-loader';
import { GuideApplication, GuideApplicationStatus } from './entities/guide-application.entity';

@Injectable()
export class GuideApplicationsRepository {
  private readonly applications: GuideApplication[] = loadSeedData<GuideApplication>(
    'guide_applications.json',
  ).map((a) => ({
    ...a,
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
    decidedAt: a.decidedAt ? new Date(a.decidedAt) : undefined,
  }));

  create(data: {
    guideId: string;
    planId: string;
    guidePricePerPerson: number;
    status: GuideApplicationStatus;
    autoDecisionReason?: string | null;
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

  findById(id: string): GuideApplication | undefined {
    const found = this.applications.find((a) => a.id === id);
    return found ? { ...found } : undefined;
  }

  findByGuideId(guideId: string): GuideApplication[] {
    return this.applications
      .filter((a) => a.guideId === guideId)
      .map((a) => ({ ...a }));
  }

  findAcceptedByPlan(planId: string): GuideApplication[] {
    return this.applications
      .filter((a) => a.planId === planId && a.status === GuideApplicationStatus.ACCEPTED)
      .map((a) => ({ ...a }));
  }

  findAccepted(guideId: string, planId: string): GuideApplication | undefined {
    const found = this.applications.find(
      (a) =>
        a.guideId === guideId &&
        a.planId === planId &&
        a.status === GuideApplicationStatus.ACCEPTED,
    );
    return found ? { ...found } : undefined;
  }

  existsActive(guideId: string, planId: string): boolean {
    return this.applications.some(
      (a) =>
        a.guideId === guideId &&
        a.planId === planId &&
        a.status !== GuideApplicationStatus.REJECTED,
    );
  }

  update(id: string, data: Partial<GuideApplication>): GuideApplication | undefined {
    const index = this.applications.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    this.applications[index] = { ...this.applications[index], ...data, updatedAt: new Date() };
    return { ...this.applications[index] };
  }
}
