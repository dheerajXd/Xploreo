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
}
