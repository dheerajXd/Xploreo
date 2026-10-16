import { Injectable } from '@nestjs/common';
import { Location } from './entities/location.entity';
import { createId } from '../common/utils/id';
import { stripUndefined } from '../common/utils/strip-undefined';
import { loadSeedData } from '../common/utils/seed-loader';

@Injectable()
export class LocationRepository {
  private locations: Location[] = loadSeedData<Location>('locations.json');

  create(data: Omit<Location, 'locationId'>): Location {
    const loc: Location = { locationId: createId(), ...data };
    this.locations.push(loc);
    return loc;
  }

  findAll(): Location[] { return this.locations; }

  findById(id: string): Location | undefined {
    return this.locations.find((l) => l.locationId === id);
  }

  findByCity(cityId: string): Location[] {
    return this.locations.filter((l) => l.cityId === cityId);
  }

  update(id: string, data: Partial<Location>): Location | undefined {
    const idx = this.locations.findIndex((l) => l.locationId === id);
    if (idx === -1) return undefined;
    this.locations[idx] = { ...this.locations[idx], ...stripUndefined(data) };
    return this.locations[idx];
  }

  delete(id: string): boolean {
    const idx = this.locations.findIndex((l) => l.locationId === id);
    if (idx === -1) return false;
    this.locations.splice(idx, 1);
    return true;
  }
}