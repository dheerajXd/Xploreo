import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from './entities/auth.entity';
import { AuthService, JWT_SECRET } from './auth.service';
import { AuthRepository } from './auth.repository';
import { AuthController } from './auth.controller';

describe('Tech Admin User & Partner Management and Restrictions', () => {
  let reflector: Reflector;
  let authRepo: AuthRepository;
  let authService: AuthService;
  let authController: AuthController;
  let authGuard: AuthGuard;
  let rolesGuard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    authRepo = new AuthRepository();
    authService = new AuthService(authRepo);
    authController = new AuthController(authService);
    authGuard = new AuthGuard(reflector, authRepo);
    rolesGuard = new RolesGuard(reflector);
  });

  function createMockContext(headers: Record<string, string>): ExecutionContext {
    const request = {
      headers,
      user: undefined as any,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  describe('1. TA User Listing & Permissions', () => {
    it('should allow Tech Admin to list eligible users and partners', async () => {
      const users = await authService.findAll();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      const traveller = users.find((u) => u.role === Role.TRAVELLER);
      expect(traveller).toBeDefined();
    });

    it('should allow Tech Admin to view a specific user by ID', async () => {
      const user = await authService.findOne('T001');
      expect(user).toBeDefined();
      expect(user.userId).toBe('T001');
      expect((user as any).password).toBeUndefined();
    });
  });

  describe('2. Suspension & Reactivation Functionality', () => {
    it('should allow TA to suspend an eligible account when reason is provided', async () => {
      const taActor = { userId: 'TA001', role: 'techadmin' };
      const updated = await authService.update(
        'T001',
        { status: 'inactive', suspensionReason: 'Suspicious booking activity' },
        taActor,
      );

      expect(updated.status).toBe('inactive');
      expect(updated.suspensionReason).toBe('Suspicious booking activity');
      expect(updated.suspendedBy).toBe('TA001');
      expect(updated.suspendedAt).toBeDefined();
    });

    it('should reject suspension when suspension reason is empty or missing', async () => {
      const taActor = { userId: 'TA001', role: 'techadmin' };
      await expect(
        authService.update('G001', { status: 'inactive', suspensionReason: '   ' }, taActor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow TA to reactivate a suspended account', async () => {
      const taActor = { userId: 'TA001', role: 'techadmin' };
      // First suspend
      await authService.update(
        'G001',
        { status: 'inactive', suspensionReason: 'Policy verification' },
        taActor,
      );

      // Then reactivate
      const reactivated = await authService.update(
        'G001',
        { status: 'active' },
        taActor,
      );

      expect(reactivated.status).toBe('active');
      expect(reactivated.suspensionReason).toBeFalsy();
    });
  });

  describe('3. TA Permission Boundaries & Security Guards', () => {
    it('should reject TA attempts to suspend or modify SuperAdmin accounts', async () => {
      const taActor = { userId: 'TA001', role: 'techadmin' };
      await expect(
        authService.update(
          'SA001',
          { status: 'inactive', suspensionReason: 'Unauthorized test' },
          taActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject TA attempts to suspend or modify TechAdmin accounts (including self)', async () => {
      const taActor = { userId: 'TA001', role: 'techadmin' };
      // Modify self
      await expect(
        authService.update(
          'TA001',
          { status: 'inactive', suspensionReason: 'Self suspension test' },
          taActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject TA attempts to change user roles or passwords', async () => {
      const taActor = { userId: 'TA001', role: 'techadmin' };
      await expect(
        authService.update(
          'T001',
          { role: Role.SUPERADMIN } as any,
          taActor,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        authService.update(
          'T001',
          { password: 'NewPassword123' },
          taActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject unauthenticated caller or non-admin from modifying user status', async () => {
      const travellerActor = { userId: 'T001', role: 'traveller' };
      await expect(
        authService.update(
          'G001',
          { status: 'inactive', suspensionReason: 'Attempt by traveler' },
          travellerActor,
        ),
      ).rejects.toThrow(ForbiddenException);

      // Traveler attempting to change own status
      await expect(
        authService.update(
          'T001',
          { status: 'inactive' },
          travellerActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. Active Session & Login Invalidation for Suspended Accounts', () => {
    it('should reject login for a suspended account', async () => {
      const taActor = { userId: 'TA001', role: 'techadmin' };
      // Suspend T001
      await authService.update(
        'T001',
        { status: 'inactive', suspensionReason: 'Payment fraud under investigation' },
        taActor,
      );

      // Attempt login
      await expect(
        authService.login({ username: 'T001', password: 'TRA@123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject active token/session in AuthGuard when account is suspended', async () => {
      // 1. Issue token while active
      const user = authRepo.findById('T001')!;
      const validToken = authService.generateToken(user);

      // Context with valid token
      const context = createMockContext({
        authorization: `Bearer ${validToken}`,
      });

      // Initially active, token is accepted
      expect(authGuard.canActivate(context)).toBe(true);

      // 2. Suspend account
      const taActor = { userId: 'TA001', role: 'techadmin' };
      await authService.update(
        'T001',
        { status: 'inactive', suspensionReason: 'Immediate security freeze' },
        taActor,
      );

      // 3. Same token should now be rejected by AuthGuard
      expect(() => authGuard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should restore token access after reactivation', async () => {
      const taActor = { userId: 'TA001', role: 'techadmin' };
      const user = authRepo.findById('T001')!;
      const token = authService.generateToken(user);
      const context = createMockContext({
        authorization: `Bearer ${token}`,
      });

      // Suspend
      await authService.update(
        'T001',
        { status: 'inactive', suspensionReason: 'Temporary freeze' },
        taActor,
      );
      expect(() => authGuard.canActivate(context)).toThrow(UnauthorizedException);

      // Reactivate
      await authService.update('T001', { status: 'active' }, taActor);
      expect(authGuard.canActivate(context)).toBe(true);
    });
  });
});
