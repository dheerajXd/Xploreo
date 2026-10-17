import { StructuredItinerary } from '../../common/entities/itinerary.entity';

export enum TripStatus {
  DRAFT = 'draft',
  PENDING_GUIDE_CONFIRM = 'pending_guide_confirm',
  CONFIRMED = 'confirmed',
  STARTED = 'started',
  COMPLETED = 'completed',
  REJECTED_BY_GUIDE = 'rejected_by_guide',
}

export enum TripTrackingStatus {
  NOT_STARTED = 'not_started',
  ONGOING = 'ongoing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export class Trip {
  id!: string;
  travellerId!: string;
  planId!: string;
  guideId?: string;
  status!: TripStatus;
  itinerary!: StructuredItinerary;
  totalAmount!: number;
  currentDay!: number;
  currentStop!: string;
  currentLocation!: string;
  trackingStatus!: TripTrackingStatus;
  progressPercentage!: number;
  lastUpdatedAt!: string;
  refundAmount?: number;
  // Guide selection: the traveller picks an NTA-approved guide, who then confirms or declines.
  guideName?: string;
  guidePricePerPerson?: number;
  guideRequestedAt?: string;
  // Shown to the traveller (in red) when the requested guide could not confirm.
  guideNote?: string;
  // Guides who already declined this trip; never offered again for it.
  declinedGuideIds?: string[];
}
