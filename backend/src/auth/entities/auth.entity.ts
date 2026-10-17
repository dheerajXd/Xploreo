import { AppRole } from '../../contracts/api-contracts';

export enum Role {
  SUPERADMIN = AppRole.SUPERADMIN,
  TRAVELLER = AppRole.TRAVELLER,
  GUIDE = AppRole.GUIDE,
  TECHADMIN = AppRole.TECHADMIN,
  NONTECHADMIN = AppRole.NONTECHADMIN,
  HOTEL = AppRole.HOTEL,
  EXPERIENCE = AppRole.EXPERIENCE,
}

export class Auth {
  userId!: string;
  username!: string;
  password!: string;
  role!: Role;
  name!: string;
  email!: string;
  phone!: string;
  location?: string;
  status!: 'active' | 'inactive';
  region?: string;
}

// Self-service roles: anyone can sign themselves up as one of these via POST /auth/register.
// Staff roles (regional admin, tech admin, super admin) are never created this way — only a
// Super Admin can create one, through the separate POST /auth/staff endpoint — otherwise any
// unauthenticated visitor could mint themselves an admin account by posting a chosen role.
export const OPERATIONAL_ROLES = [Role.TRAVELLER, Role.GUIDE, Role.HOTEL, Role.EXPERIENCE] as const;
export const STAFF_ROLES = [Role.NONTECHADMIN, Role.TECHADMIN] as const;
