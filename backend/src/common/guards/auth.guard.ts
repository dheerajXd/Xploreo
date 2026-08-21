import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Role } from '../../auth/entities/auth.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const rawRole =
      request.headers['x-user-role'] ??
      request.headers['role'] ??
      request.headers['user-role'];
    const rawUserId =
      request.headers['x-user-id'] ??
      request.headers['user-id'] ??
      request.headers['userid'];

    const role = normalizeRole(Array.isArray(rawRole) ? rawRole[0] : rawRole);
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    if (!role) {
      throw new ForbiddenException('x-user-role header is required');
    }

    request.user = {
      userId: userId ? String(userId) : undefined,
      role,
    };

    return true;
  }
}

function normalizeRole(value: unknown): Role | null {
  const rawRole = String(value || '').trim();
  const legacyRole = rawRole.toLowerCase();
  if (legacyRole === Role.SUPERADMIN) return Role.SUPERADMIN;
  if (legacyRole === Role.TRAVELLER || legacyRole === 'traveler') {
    return Role.TRAVELLER;
  }
  if (legacyRole === Role.GUIDE) return Role.GUIDE;
  if (legacyRole === Role.TECHADMIN) return Role.TECHADMIN;
  if (legacyRole === Role.NONTECHADMIN) return Role.NONTECHADMIN;
  if (legacyRole === Role.HOTEL) return Role.HOTEL;
  if (legacyRole === Role.EXPERIENCE) return Role.EXPERIENCE;

  return null;
}
