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
import { LoginDto } from './dto/login.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Role } from './entities/auth.entity';

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

  async findAll() {
    const users = await this.authRepository.findAll();
    return users.map(({ password: _pw, ...u }) => u);
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
    const isSuperAdmin = actor?.role === 'superadmin';
    const isTechAdmin = actor?.role === 'techadmin';

    // 1. TechAdmin enforcement
    if (isTechAdmin) {
      const targetUser = await this.authRepository.findById(id);
      if (!targetUser) throw new NotFoundException(`User ${id} not found`);

      // TechAdmin cannot suspend or modify SuperAdmin or TechAdmin (including self)
      if (targetUser.role === Role.SUPERADMIN || targetUser.role === Role.TECHADMIN) {
        throw new ForbiddenException(
          'TechAdmin is not permitted to modify administrator accounts.',
        );
      }
      if (actor?.userId && targetUser.userId === actor.userId) {
        throw new ForbiddenException('You cannot modify or suspend your own account.');
      }

      // TechAdmin cannot change user roles, passwords, emails, etc.
      if (dto.role !== undefined) {
        throw new ForbiddenException('TechAdmin cannot change user roles.');
      }
      if (dto.password !== undefined) {
        throw new ForbiddenException('TechAdmin cannot change user passwords.');
      }

      // If updating status
      if (dto.status !== undefined) {
        if (dto.status === 'inactive') {
          const reason = (dto.suspensionReason || dto.reason || '').trim();
          if (!reason) {
            throw new BadRequestException('A non-empty suspension reason is required.');
          }
          (dto as any).suspensionReason = reason;
          (dto as any).suspendedAt = new Date().toISOString();
          (dto as any).suspendedBy = actor.userId || 'techadmin';
        } else if (dto.status === 'active') {
          (dto as any).suspensionReason = null;
          (dto as any).suspendedAt = null;
          (dto as any).suspendedBy = null;
        }
      }
    } else if (!isSuperAdmin) {
      // Regular user (or other role)
      if (actor?.userId !== id) {
        throw new ForbiddenException('You can only update your own account.');
      }
      if (dto.role !== undefined) {
        throw new ForbiddenException('You cannot change your account type.');
      }
      if (dto.status !== undefined) {
        throw new ForbiddenException('Only administrators can change account status.');
      }
    } else {
      // SuperAdmin: if setting inactive with reason, capture it
      if (dto.status === 'inactive') {
        const reason = (dto.suspensionReason || dto.reason || '').trim();
        if (reason) {
          (dto as any).suspensionReason = reason;
          (dto as any).suspendedAt = new Date().toISOString();
          (dto as any).suspendedBy = actor?.userId || 'superadmin';
        }
      } else if (dto.status === 'active') {
        (dto as any).suspensionReason = null;
        (dto as any).suspendedAt = null;
        (dto as any).suspendedBy = null;
      }
    }

    const updated = await this.authRepository.update(id, dto);
    if (!updated) throw new NotFoundException(`User ${id} not found`);
    const { password: _pw, ...safe } = updated;
    return safe;
  }

  async remove(id: string) {
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
