export enum GuideApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export class GuideApplication {
  id!: string;
  guideId!: string;
  // Exactly one of these is set — an application targets either a travel plan or a single
  // experience, never both. See GuideApplicationsService#create.
  planId?: string;
  experienceId?: string;
  guidePricePerPerson!: number;
  status!: GuideApplicationStatus;
  // Reason recorded with the latest decision (NTA accept/reject/revoke), or null while pending.
  autoDecisionReason?: string | null;
  decidedBy?: string;
  decidedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
