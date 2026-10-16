import { Injectable } from '@nestjs/common';
import { stripUndefined } from '../common/utils/strip-undefined';
import { loadSeedData } from '../common/utils/seed-loader';

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

  constructor() {
    const seeds = loadSeedData<any>('partner_profiles.json', []);
    for (const item of seeds) {
      if (item.userId) {
        this.profiles.set(item.userId, {
          hotelName: item.businessName || 'Xploreo Partner Hotel',
          description: item.description || 'Verified Xploreo Partner',
          contactNumber: item.phone || '',
          email: item.email || '',
          location: item.location || '',
          gst: item.taxId || '',
          bankAccount: item.bankAccount || '',
          payoutMethod: 'Bank Transfer',
          checkInTime: '14:00',
          checkOutTime: '11:00',
          cancellationPolicy: 'Flexible: Free cancellation up to 48 hours before check-in',
          logo: '',
        });
      }
    }
  }

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
