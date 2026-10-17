import { Injectable } from '@nestjs/common';
import { Traveller, Interest } from './entities/traveller.entity';
import { stripUndefined } from '../common/utils/strip-undefined';
import { loadSeedData } from '../common/utils/seed-loader';

@Injectable()
export class TravellerRepository {
  private travellers: Traveller[] = loadSeedData<Traveller>('travellers.json');

  create(traveller: Traveller): Traveller {
    this.travellers.push(traveller);
    return traveller;
  }

  findAll(): Traveller[] {
    return this.travellers;
  }

  findById(userId: string): Traveller | undefined {
    return this.travellers.find((t) => t.userId === userId || (t as any).legacyId === userId);
  }

  update(userId: string, data: Partial<Traveller>): Traveller | undefined {
    const idx = this.travellers.findIndex((t) => t.userId === userId);
    if (idx === -1) return undefined;
    this.travellers[idx] = { ...this.travellers[idx], ...stripUndefined(data) };
    return this.travellers[idx];
  }

  delete(userId: string): boolean {
    const idx = this.travellers.findIndex((t) => t.userId === userId);
    if (idx === -1) return false;
    this.travellers.splice(idx, 1);
    return true;
  }
}
