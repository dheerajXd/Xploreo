import { Injectable } from '@nestjs/common';
import { Nontechadmin } from './entities/nontechadmin.entity';
import { createId } from '../common/utils/id';
import { stripUndefined } from '../common/utils/strip-undefined';

@Injectable()
export class NontechadminRepository {
  private admins: Nontechadmin[] = [
    {
      adminId: 'NTA001',
      location: 'Mumbai',
    },
  ];

  create(data: Omit<Nontechadmin, 'adminId'>): Nontechadmin {
    const admin: Nontechadmin = { adminId: createId(), ...data };
    this.admins.push(admin);
    return admin;
  }

  findAll(): Nontechadmin[] { return this.admins; }

  findById(id: string): Nontechadmin | undefined {
    return this.admins.find((a) => a.adminId === id);
  }

  update(id: string, data: Partial<Nontechadmin>): Nontechadmin | undefined {
    const idx = this.admins.findIndex((a) => a.adminId === id);
    if (idx === -1) return undefined;
    this.admins[idx] = { ...this.admins[idx], ...stripUndefined(data) };
    return this.admins[idx];
  }

  delete(id: string): boolean {
    const idx = this.admins.findIndex((a) => a.adminId === id);
    if (idx === -1) return false;
    this.admins.splice(idx, 1);
    return true;
  }
}
