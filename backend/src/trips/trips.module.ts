import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TripsRepository } from './trips.repository';
import { PlansModule } from '../plans/plans.module';
import { GuideApplicationsModule } from '../guide-applications/guide-applications.module';
import { GuideAssignmentsController } from './guide-assignments.controller';

@Module({
  imports: [PlansModule, GuideApplicationsModule],
  controllers: [TripsController, GuideAssignmentsController],
  providers: [TripsService, TripsRepository],
  exports: [TripsService, TripsRepository],
})
export class TripsModule {}
