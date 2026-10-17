import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Role } from '../../auth/entities/auth.entity';
import { JWT_SECRET } from '../../auth/auth.service';

import { AuthRepository } from '../../auth/auth.repository';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authRepository?: AuthRepository,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader =
      request.headers['authorization'] ??
      request.headers['Authorization'] ??
      request.headers['x-access-token'];

    // 1. Verify signed token if provided
    let token: string | undefined;
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          userId: string;
          username: string;
          role: string;
          region?: string;
        };
        const role = normalizeRole(decoded.role);
        if (!role) {
          throw new UnauthorizedException('Invalid role claim in token');
        }

        // Live check: reject if user account is suspended/inactive
        if (this.authRepository && decoded.userId) {
          const liveUser = this.authRepository.findById(String(decoded.userId));
          if (liveUser && liveUser.status === 'inactive') {
            throw new UnauthorizedException(
              'Account has been restricted. Please contact support.',
            );
          }
        }

        request.user = {
          userId: decoded.userId ? String(decoded.userId) : undefined,
          username: decoded.username,
          role,
          region: decoded.region,
        };
        return true;
      } catch (err) {
        if (err instanceof UnauthorizedException) {
          throw err;
        }
        throw new UnauthorizedException(
          err instanceof Error && err.name === 'TokenExpiredError'
            ? 'Session token expired. Please log in again.'
            : 'Invalid or forged authentication token.',
        );
      }
    }

    // 2. Reject unauthenticated access. Never trust client-supplied raw headers.
    throw new UnauthorizedException(
      'Authentication token required. Please log in to continue.',
    );
  }
}

function normalizeRole(value: unknown): Role | null {
  const rawRole = String(value || '').trim();
  const legacyRole = rawRole.toLowerCase();
  if (legacyRole === Role.SUPERADMIN || legacyRole === 'admin') return Role.SUPERADMIN;
  if (legacyRole === Role.TRAVELLER || legacyRole === 'traveler') {
    return Role.TRAVELLER;
  }
  if (legacyRole === Role.GUIDE) return Role.GUIDE;
  if (legacyRole === Role.TECHADMIN || legacyRole === 'tech_admin') return Role.TECHADMIN;
  if (legacyRole === Role.NONTECHADMIN || legacyRole === 'nontech_admin') return Role.NONTECHADMIN;
  if (legacyRole === Role.HOTEL || legacyRole === 'partner' || legacyRole === 'hotel_partner') return Role.HOTEL;
  if (legacyRole === Role.EXPERIENCE || legacyRole === 'experience_partner') return Role.EXPERIENCE;

  return null;
}
