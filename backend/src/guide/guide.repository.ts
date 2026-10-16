import { Injectable } from '@nestjs/common';
import { Guide } from './entities/guide.entity';
import { stripUndefined } from '../common/utils/strip-undefined';
import { loadSeedData } from '../common/utils/seed-loader';

@Injectable()
export class GuideRepository {
  private guides: Guide[] = loadSeedData<Guide>('guides.json');

  create(guide: Guide): Guide {
    this.guides.push(guide);
    return guide;
  }

  findAll(): Guide[] {
    return this.guides;
  }

  findById(userId: string): Guide | undefined {
    return this.guides.find((g) => g.userId === userId);
  }

  findByLocation(locationId: string): Guide[] {
    return this.guides.filter((g) => g.location === locationId);
  }

  update(userId: string, data: Partial<Guide>): Guide | undefined {
    const idx = this.guides.findIndex((g) => g.userId === userId);
    if (idx === -1) return undefined;
    this.guides[idx] = { ...this.guides[idx], ...stripUndefined(data) };
    return this.guides[idx];
  }

  delete(userId: string): boolean {
    const idx = this.guides.findIndex((g) => g.userId === userId);
    if (idx === -1) return false;
    this.guides.splice(idx, 1);
    return true;
  }
}
