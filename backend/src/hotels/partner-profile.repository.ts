import { Injectable } from '@nestjs/common';
import { stripUndefined } from '../common/utils/strip-undefined';

export class PartnerProfile {
  hotelName!: string;
  description!: string;
  contactNumber!: string;
  email!: string;
  location!: string;
  gst!: string;
  bankAccount!: string;
  payoutMethod!: string;
  checkInTime!: string;
  checkOutTime!: string;
  cancellationPolicy!: string;
  logo!: string;
}

@Injectable()
export class PartnerProfileRepository {
  private readonly profiles = new Map<string, PartnerProfile>();

  get(partnerId: string, fallback: () => PartnerProfile): PartnerProfile {
    if (!this.profiles.has(partnerId)) this.profiles.set(partnerId, fallback());
    return { ...this.profiles.get(partnerId)! };
  }

  save(partnerId: string, patch: Partial<PartnerProfile>, fallback: () => PartnerProfile): PartnerProfile {
    const current = this.get(partnerId, fallback);
    const next = { ...current, ...stripUndefined(patch) };
    this.profiles.set(partnerId, next);
    return { ...next };
  }
}
