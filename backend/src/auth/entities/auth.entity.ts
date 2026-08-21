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
  status!: 'active' | 'inactive';
}
