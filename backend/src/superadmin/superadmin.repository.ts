import { Injectable } from '@nestjs/common';
import { Superadmin } from './entities/superadmin.entity';
import { createId } from '../common/utils/id';
import { stripUndefined } from '../common/utils/strip-undefined';
import { loadSeedRecord } from '../common/utils/seed-loader';

@Injectable()
export class SuperadminRepository {
  private admins: Superadmin[] =
    loadSeedRecord<{ superAdmins: Superadmin[] }>('admins.json', { superAdmins: [] }).superAdmins || [];

  create(data: Omit<Superadmin, 'adminId'>): Superadmin {
    const admin: Superadmin = { adminId: createId(), ...data };
    this.admins.push(admin);
    return admin;
  }

  findAll(): Superadmin[] { return this.admins; }

  findById(id: string): Superadmin | undefined {
    return this.admins.find((a) => a.adminId === id || (a as any).legacyId === id);
  }

  update(id: string, data: Partial<Superadmin>): Superadmin | undefined {
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
