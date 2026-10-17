import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { ExperienceBookingsModule } from '../experience-bookings/experience-bookings.module';
import { ExperiencesModule } from '../experiences/experiences.module';
import { HotelsModule } from '../hotels/hotels.module';
import { PlansModule } from '../plans/plans.module';
import { TripsModule } from '../trips/trips.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [TripsModule, PlansModule, BookingsModule, HotelsModule, ExperienceBookingsModule, ExperiencesModule],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
