import { Injectable } from '@nestjs/common';
import { Techadmin } from './entities/techadmin.entity';
import { createId } from '../common/utils/id';
import { stripUndefined } from '../common/utils/strip-undefined';
import { loadSeedRecord } from '../common/utils/seed-loader';

@Injectable()
export class TechadminRepository {
  private admins: Techadmin[] =
    loadSeedRecord<{ techAdmins: Techadmin[] }>('admins.json', { techAdmins: [] }).techAdmins || [];

  create(data: Omit<Techadmin, 'adminId'>): Techadmin {
    const admin: Techadmin = { adminId: createId(), ...data };
    this.admins.push(admin);
    return admin;
  }

  findAll(): Techadmin[] { return this.admins; }

  findById(id: string): Techadmin | undefined {
    return this.admins.find((a) => a.adminId === id || (a as any).legacyId === id);
  }

  update(id: string, data: Partial<Techadmin>): Techadmin | undefined {
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
