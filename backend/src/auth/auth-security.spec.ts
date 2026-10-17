import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from './entities/auth.entity';
import { JWT_SECRET } from './auth.service';
import { TripsService } from '../trips/trips.service';
import { TripsRepository } from '../trips/trips.repository';
import { PlansRepository } from '../plans/plans.repository';
import { PlansService } from '../plans/plans.service';
import { GuideApplicationsRepository } from '../guide-applications/guide-applications.repository';
import { TravellerService } from '../traveller/traveller.service';
import { TravellerRepository } from '../traveller/traveller.repository';
import { GuideService } from '../guide/guide.service';
import { GuideRepository } from '../guide/guide.repository';

describe('Phase 4B Security Fixes Specification', () => {
  let reflector: Reflector;
  let authGuard: AuthGuard;
  let rolesGuard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    authGuard = new AuthGuard(reflector);
    rolesGuard = new RolesGuard(reflector);
  });

  function createMockContext(headers: Record<string, string>, handlerRoles?: Role[]): ExecutionContext {
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

  describe('Priority 1: Authentication & Signed Token Verification', () => {
    it('should reject unauthenticated request when token is missing', () => {
      const context = createMockContext({});
      expect(() => authGuard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should reject forged client headers without valid signed token', () => {
      const context = createMockContext({
        'x-user-role': 'superadmin',
        'x-user-id': 'SA001',
      });
      expect(() => authGuard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should reject tokens signed with invalid secret', () => {
      const fakeToken = jwt.sign({ userId: 'SA001', role: 'superadmin' }, 'wrong-secret');
      const context = createMockContext({
        authorization: `Bearer ${fakeToken}`,
      });
      expect(() => authGuard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should successfully authenticate and populate trusted user from valid signed JWT', () => {
      const validToken = jwt.sign(
        { userId: 'NTA001', username: 'NTA001', role: 'nontechadmin', region: 'Jaipur' },
        JWT_SECRET,
      );
      const context = createMockContext({
        authorization: `Bearer ${validToken}`,
      });
      const result = authGuard.canActivate(context);
      expect(result).toBe(true);

      const req = context.switchToHttp().getRequest();
      expect(req.user).toEqual({
        userId: 'NTA001',
        username: 'NTA001',
        role: Role.NONTECHADMIN,
        region: 'Jaipur',
      });
    });
  });

  describe('Priority 2: Trip Ownership & Privacy Protection', () => {
    let tripsService: TripsService;
    let tripsRepo: TripsRepository;
    let plansRepo: PlansRepository;
    let guideAppsRepo: GuideApplicationsRepository;

    beforeEach(() => {
      tripsRepo = new TripsRepository();
      plansRepo = new PlansRepository();
      guideAppsRepo = new GuideApplicationsRepository();
      tripsService = new TripsService(tripsRepo, plansRepo, new GuideRepository());
    });

    it('should prevent traveler from viewing another traveler trip (Horizontal IDOR)', () => {
      // Find a trip belonging to 'T001'
      const allTrips = tripsRepo.findAll();
      const trip = allTrips[0]; // travellerId is T001 / 20001
      expect(trip).toBeDefined();

      const attackerActor = { userId: 'ATTACKER_999', role: 'traveller' };
      expect(() => tripsService.findOne(trip.id, attackerActor)).toThrow(ForbiddenException);
    });

    it('should allow trip owner traveler to view their own trip', () => {
      const allTrips = tripsRepo.findAll();
      const trip = allTrips[0];

      const ownerActor = { userId: trip.travellerId, role: 'traveller' };
      const result = tripsService.findOne(trip.id, ownerActor);
      expect(result.id).toBe(trip.id);
    });

    it('should prevent traveler from querying another traveler trips via findByTraveller', () => {
      const attackerActor = { userId: 'T002', role: 'traveller' };
      expect(() => tripsService.findByTraveller('T001', attackerActor)).toThrow(ForbiddenException);
    });

    it('should allow SuperAdmin to view any trip', () => {
      const allTrips = tripsRepo.findAll();
      const trip = allTrips[0];

      const saActor = { userId: 'SA001', role: 'superadmin' };
      const result = tripsService.findOne(trip.id, saActor);
      expect(result.id).toBe(trip.id);
    });
  });

  describe('Priority 2: Profile Contact & Banking Privacy', () => {
    let travellerService: TravellerService;
    let travellerRepo: TravellerRepository;
    let guideService: GuideService;
    let guideRepo: GuideRepository;

    beforeEach(() => {
      travellerRepo = new TravellerRepository();
      travellerService = new TravellerService(travellerRepo);
      guideRepo = new GuideRepository();
      guideService = new GuideService(guideRepo);
    });

    it('should redact phone and email when traveler profile is viewed by third party', () => {
      const thirdPartyActor = { userId: 'OTHER_USER', role: 'traveller' };
      const profile = travellerService.findOne('20001', thirdPartyActor) as any;
      expect(profile.fname).toBe('Anjali');
      expect(profile.email).toBeUndefined();
      expect(profile.phno).toBeUndefined();
    });

    it('should reveal full details when traveler views their own profile', () => {
      const selfActor = { userId: '20001', role: 'traveller' };
      const profile = travellerService.findOne('20001', selfActor) as any;
      expect(profile.email).toBe('anjali@xploreo.com');
      expect(profile.phno).toBe(9123456780);
    });

    it('should redact IBAN and bank account when guide profile is viewed by traveler', () => {
      const travellerActor = { userId: '20001', role: 'traveller' };
      const guideProfile = guideService.findOne('G001', travellerActor) as any;
      expect(guideProfile.fname).toBe('Sreekar');
      expect(guideProfile.iban).toBeUndefined();
      expect(guideProfile.bank_acc_num_end).toBeUndefined();
      expect(guideProfile.phone).toBeUndefined();
    });
  });

  describe('Priority 3: NTA Regional Isolation', () => {
    let plansService: PlansService;
    let plansRepo: PlansRepository;

    beforeEach(() => {
      plansRepo = new PlansRepository();
      plansService = new PlansService(plansRepo);
    });

    it('should restrict NTA findAll to only their assigned region', () => {
      const ntaActor = { userId: 'NTA001', role: 'nontechadmin', region: 'Jaipur' };
      // Attempt to query with destination='Goa'
      const result = plansService.findAll({ destination: 'Goa' }, ntaActor);
      expect(result.data.every((p) => p.destination.toLowerCase() === 'jaipur')).toBe(true);
    });

    it('should prevent NTA from creating a travel package outside assigned region', () => {
      const ntaActor = { userId: 'NTA001', role: 'nontechadmin', region: 'Jaipur' };
      const foreignPlanDto = {
        title: 'Goa Beach Trip',
        description: 'Sunny beaches',
        destination: 'Goa',
        originCity: 'Mumbai',
        durationNights: 3,
        pricePerPerson: 15000,
      } as any;

      expect(() => plansService.create(foreignPlanDto, ntaActor)).toThrow(ForbiddenException);
    });

    it('should allow NTA to create a travel package in their assigned region', () => {
      const ntaActor = { userId: 'NTA001', role: 'nontechadmin', region: 'Jaipur' };
      const jaipurPlanDto = {
        title: 'Jaipur Heritage Tour',
        description: 'Explore forts and palaces',
        destination: 'Jaipur',
        originCity: 'Delhi',
        durationNights: 3,
        pricePerPerson: 18000,
      } as any;

      const created = plansService.create(jaipurPlanDto, ntaActor);
      expect(created.destination).toBe('Jaipur');
    });

    it('should preserve SuperAdmin ability to create and query globally across all regions', () => {
      const saActor = { userId: 'SA001', role: 'superadmin' };
      const goaPlanDto = {
        title: 'Global SA Goa Plan',
        description: 'SuperAdmin created',
        destination: 'Goa',
        originCity: 'Bangalore',
        durationNights: 4,
        pricePerPerson: 22000,
      } as any;

      const created = plansService.create(goaPlanDto, saActor);
      expect(created.destination).toBe('Goa');

      const allPlans = plansService.findAll({}, saActor);
      expect(allPlans.data.length).toBeGreaterThan(1);
    });

    describe('Five Regional NTA Accounts & Isolation Validation', () => {
      const regionalNTAs = [
        { userId: 'NTA001', role: 'nontechadmin', region: 'Jaipur' },
        { userId: 'NTA002', role: 'nontechadmin', region: 'Goa' },
        { userId: 'NTA003', role: 'nontechadmin', region: 'Delhi' },
        { userId: 'NTA004', role: 'nontechadmin', region: 'Mumbai' },
        { userId: 'NTA005', role: 'nontechadmin', region: 'Kerala' },
      ];

      it.each(regionalNTAs)('should enforce strict regional isolation for %s ($userId)', (nta) => {
        const plans = plansService.findAll({}, nta);
        expect(plans.data.every((p) => p.destination.toLowerCase() === nta.region.toLowerCase())).toBe(true);
      });

      it('should prevent NTA001 (Jaipur) from accessing or mutating restricted Goa records', () => {
        const ntaJaipur = { userId: 'NTA001', role: 'nontechadmin', region: 'Jaipur' };
        expect(() =>
          plansService.create(
            {
              title: 'Goa Unsanctioned Plan',
              description: 'Attempted cross-region create',
              destination: 'Goa',
              originCity: 'Mumbai',
              durationNights: 3,
              pricePerPerson: 20000,
            } as any,
            ntaJaipur,
          ),
        ).toThrow(ForbiddenException);
      });

      it('should prevent NTA002 (Goa) from accessing or mutating restricted Jaipur records', () => {
        const ntaGoa = { userId: 'NTA002', role: 'nontechadmin', region: 'Goa' };
        expect(() =>
          plansService.create(
            {
              title: 'Jaipur Unsanctioned Plan',
              description: 'Attempted cross-region create',
              destination: 'Jaipur',
              originCity: 'Delhi',
              durationNights: 3,
              pricePerPerson: 20000,
            } as any,
            ntaGoa,
          ),
        ).toThrow(ForbiddenException);
      });

      it('should prevent NTA003 (Delhi), NTA004 (Mumbai), NTA005 (Kerala) from mutating foreign regions', () => {
        const ntaDelhi = { userId: 'NTA003', role: 'nontechadmin', region: 'Delhi' };
        const ntaMumbai = { userId: 'NTA004', role: 'nontechadmin', region: 'Mumbai' };
        const ntaKerala = { userId: 'NTA005', role: 'nontechadmin', region: 'Kerala' };

        expect(() =>
          plansService.create({ destination: 'Mumbai', title: 'T' } as any, ntaDelhi),
        ).toThrow(ForbiddenException);

        expect(() =>
          plansService.create({ destination: 'Kerala', title: 'T' } as any, ntaMumbai),
        ).toThrow(ForbiddenException);

        expect(() =>
          plansService.create({ destination: 'Delhi', title: 'T' } as any, ntaKerala),
        ).toThrow(ForbiddenException);
      });
    });
  });
});
