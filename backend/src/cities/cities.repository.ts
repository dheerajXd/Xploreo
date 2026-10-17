import { Injectable } from '@nestjs/common';
import { City } from './entities/city.entity';
import { createId } from '../common/utils/id';
import { stripUndefined } from '../common/utils/strip-undefined';
import { loadSeedData } from '../common/utils/seed-loader';

@Injectable()
export class CitiesRepository {
  private cities: City[] = loadSeedData<City>('cities.json');

  create(data: Omit<City, 'id'>): City {
    const city: City = { id: createId(), ...data };
    this.cities.push(city);
    return city;
  }

  findAll(): City[] { return this.cities; }

  findByName(name: string): City | undefined {
    return this.cities.find((c) => c.name.toLowerCase() === name.toLowerCase());
  }

  findById(id: string): City | undefined {
    return this.cities.find((c) => c.id === id);
  }

  update(id: string, data: Partial<City>): City | undefined {
    const idx = this.cities.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.cities[idx] = { ...this.cities[idx], ...stripUndefined(data) };
    return this.cities[idx];
  }

  delete(id: string): boolean {
    const idx = this.cities.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.cities.splice(idx, 1);
    return true;
  }
}