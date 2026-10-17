import { Module } from '@nestjs/common';
import { GuideApplicationsModule } from '../guide-applications/guide-applications.module';
import { GuideModule } from '../guide/guide.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { ExperienceBookingsModule } from '../experience-bookings/experience-bookings.module';
import { TripsModule } from '../trips/trips.module';
import { TripGuidesController } from './trip-guides.controller';
import { TripGuidesService } from './trip-guides.service';

@Module({
  imports: [TripsModule, GuideApplicationsModule, GuideModule, ReviewsModule, ExperienceBookingsModule],
  controllers: [TripGuidesController],
  providers: [TripGuidesService],
})
export class TripGuidesModule {}
