import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/create-auth.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { OPERATIONAL_ROLES, Role, STAFF_ROLES } from './entities/auth.entity';

export const JWT_SECRET = process.env.JWT_SECRET || 'xploreo-dev-secret-key-2026';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(dto: RegisterDto) {
    const existing = await this.authRepository.findByUsername(dto.username);
    if (existing) throw new ConflictException('Username already exists');

    const existingEmail = await this.authRepository.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already exists');

    const user = await this.authRepository.create({
      userId: dto.username,
      username: dto.username,
      password: dto.password,
      role: dto.role,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      location: dto.location,
      status: 'active',
    });

    const { password: _pw, ...safe } = user;
    const token = this.generateToken(safe);
    return { message: 'Registered successfully', user: { ...safe, token }, token };
  }

  // Admin Management (Super Admin only, enforced at the controller) — creates a Regional
  // (NonTechAdmin) or Tech Admin account. Super Admin accounts are never created via the API.
  async createStaff(dto: CreateStaffDto) {
    const existing = await this.authRepository.findByUsername(dto.username);
    if (existing) throw new ConflictException('Username already exists');

    const existingEmail = await this.authRepository.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already exists');

    if (dto.role === Role.NONTECHADMIN && !dto.region?.trim()) {
      throw new BadRequestException('A regional admin needs a region to be assigned.');
    }

    const user = await this.authRepository.create({
      userId: dto.username,
      username: dto.username,
      password: dto.password,
      role: dto.role,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      region: dto.role === Role.NONTECHADMIN ? dto.region?.trim() : undefined,
      status: 'active',
    });

    const { password: _pw, ...safe } = user;
    return safe;
  }

  async login(dto: LoginDto) {
    const rawUsername = dto.username?.trim();
    const user =
      this.authRepository.findByUsername(rawUsername) ??
      this.authRepository.findByEmail(rawUsername);
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException('Account has been restricted. Please contact support.');
    }

    const { password: _pw, ...safe } = user;
    const region = this.authRepository.findRegionForUser(user.userId);
    const token = this.generateToken({ ...safe, region });

    return {
      user: { ...safe, region, token },
      token,
      headers: {
        'x-user-id': user.userId,
        'x-user-role': toApiHeaderRole(user.role),
        Authorization: `Bearer ${token}`,
      },
    };
  }

  generateToken(user: { userId: string; username: string; role: string; region?: string }): string {
    return jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        role: user.role,
        region: user.region,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
  }

  async findAll(actor?: { role?: string }) {
    const users = await this.authRepository.findAll();
    const safe = users.map(({ password: _pw, ...u }) => u);
    // Tech Admin gets Users & Partners (the operational accounts) only — Admin Management
    // (regional/tech admin accounts) is Super Admin's alone.
    if (actor?.role === Role.TECHADMIN) {
      return safe.filter((u) => (OPERATIONAL_ROLES as readonly string[]).includes(u.role));
    }
    return safe;
  }

  // Admin Management listing: regional + tech admin accounts only (never Super Admin — there is
  // no UI or endpoint that edits one, so there is no reason to even list them here).
  async findStaff() {
    const users = await this.authRepository.findAll();
    return users
      .filter((u) => (STAFF_ROLES as readonly string[]).includes(u.role))
      .map(({ password: _pw, ...u }) => u);
  }

  async findOne(id: string) {
    const user = await this.authRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const { password: _pw, ...safe } = user;
    return safe;
  }

  async update(
    id: string,
    dto: UpdateAuthDto,
    actor?: { userId?: string; role?: string },
  ) {
    const isSuperAdmin = actor?.role === Role.SUPERADMIN;
    const isTechAdmin = actor?.role === Role.TECHADMIN;
    const isSelf = actor?.userId === id;
    const target = await this.authRepository.findById(id);
    if (!target) throw new NotFoundException(`User ${id} not found`);

    // Super Admin accounts are never edited through this endpoint — by Super Admin, Tech Admin,
    // or anyone else, including themselves — so one can't be deactivated or locked out by mistake.
    if (target.role === Role.SUPERADMIN) {
      throw new ForbiddenException('Super Admin accounts cannot be modified here.');
    }

    if (isSuperAdmin) {
      // Full power, subject to the Super Admin guard above.
    } else if (isTechAdmin && !isSelf) {
      // Users & Partners: Tech Admin may view and suspend/restore an operational account, but
      // cannot touch admin accounts or change anything other than status.
      if (!(OPERATIONAL_ROLES as readonly string[]).includes(target.role)) {
        throw new ForbiddenException('Tech Admin can only manage guide, traveller, hotel, and experience accounts.');
      }
      const changedFields = Object.keys(dto).filter((key) => dto[key as keyof UpdateAuthDto] !== undefined);
      if (changedFields.some((key) => key !== 'status')) {
        throw new ForbiddenException('Tech Admin can only change account status.');
      }
    } else if (!isSelf) {
      throw new ForbiddenException('You can only update your own account.');
    } else {
      if (dto.role !== undefined) {
        throw new ForbiddenException('You cannot change your account type.');
      }
      if (dto.status !== undefined) {
        throw new ForbiddenException('Only administrators can change account status.');
      }
    }

    const updated = await this.authRepository.update(id, dto);
    if (!updated) throw new NotFoundException(`User ${id} not found`);
    const { password: _pw, ...safe } = updated;
    return safe;
  }

  async remove(id: string, actor?: { role?: string }) {
    const target = await this.authRepository.findById(id);
    if (!target) throw new NotFoundException(`User ${id} not found`);
    if (target.role === Role.SUPERADMIN) {
      throw new ForbiddenException('Super Admin accounts cannot be deleted.');
    }
    if (actor?.role === Role.TECHADMIN && !(OPERATIONAL_ROLES as readonly string[]).includes(target.role)) {
      throw new ForbiddenException('Tech Admin can only manage guide, traveller, hotel, and experience accounts.');
    }
    const deleted = await this.authRepository.delete(id);
    if (!deleted) throw new NotFoundException(`User ${id} not found`);
    return { message: `User ${id} deleted` };
  }
}

function toApiHeaderRole(role: string): string {
  if (role === 'traveller') return 'TRAVELLER';
  if (role === 'hotel') return 'PARTNER';
  return role;
}
