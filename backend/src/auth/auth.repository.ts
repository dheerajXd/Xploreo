import { Injectable } from '@nestjs/common';
import { Auth, Role } from './entities/auth.entity';
import { createId } from '../common/utils/id';
import { stripUndefined } from '../common/utils/strip-undefined';

@Injectable()
export class AuthRepository {
  private users: Auth[] = [
    {
      userId: 'T001',
      username: 'T001',
      password: 'TRA@123',
      role: Role.TRAVELLER,
      name: 'Anjali Sharma',
      email: 'anjali@xploreo.com',
      phone: '9123456780',
      status: 'active',
    },

    {
      userId: 'G001',
      username: 'G001',
      password: 'GUD@123',
      role: Role.GUIDE,
      name: 'Sreekar',
      email: 'sreekar@gmail.com',
      phone: '9876543210',
      status: 'active',
    },
    {
      userId: 'SA001',
      username: 'SA001',
      password: 'SA@123',
      role: Role.SUPERADMIN,
      name: 'Rahul Varma',
      email: 'rahul@xploreo.com',
      phone: '9876543210',
      status: 'active',
    },
    {
      userId: 'TA001',
      username: 'TA001',
      password: 'TA@123',
      role: Role.TECHADMIN,
      name: 'Rahul Varma',
      email: 'rahul@xploreo.com',
      phone: '9876543210',
      status: 'active',
    },
    {
      userId: 'NTA001',
      username: 'NTA001',
      password: 'NTA@123',
      role: Role.NONTECHADMIN,
      name: 'Neha Mehra',
      email: 'nontech.admin@xploreo.com',
      phone: '9000000003',
      status: 'active',
    },
    {
      userId: 'HP001',
      username: 'HP001',
      password: 'HP@123',
      role: Role.HOTEL,
      name: 'Xploreo Hotel Partner',
      email: 'hotel.partner@xploreo.com',
      phone: '9000000001',
      status: 'active',
      region: 'Jaipur',
    },
    {
      userId: 'XP001',
      username: 'XP001',
      password: 'XP@123',
      role: Role.EXPERIENCE,
      name: 'Xploreo Experience Partner',
      email: 'experience.partner@xploreo.com',
      phone: '9000000002',
      status: 'active',
    },
  ];

  create(data: Partial<Auth>): Auth {
    const user: Auth = {
      userId: data.userId || createId(),
      username: data.username!,
      password: data.password!,
      role: data.role!,
      name: data.name!,
      email: data.email!,
      phone: data.phone!,
      status: data.status ?? 'active',
    };
    this.users.push(user);
    return user;
  }

  findAll(): Auth[] {
    return [...this.users].sort((a, b) => a.name.localeCompare(b.name));
  }

  findById(userId: string): Auth | undefined {
    return this.users.find((u) => u.userId === userId);
  }

  findByUsername(username: string): Auth | undefined {
    return this.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );
  }

  findByEmail(email: string): Auth | undefined {
    return this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
  }

  update(userId: string, data: Partial<Auth>): Auth | undefined {
    const idx = this.users.findIndex((u) => u.userId === userId);
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...stripUndefined(data) };
    return this.users[idx];
  }

  delete(userId: string): boolean {
    const idx = this.users.findIndex((u) => u.userId === userId);
    if (idx === -1) return false;
    this.users.splice(idx, 1);
    return true;
  }
}
