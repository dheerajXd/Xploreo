import { Module } from '@nestjs/common';
import { ExperienceBookingsModule } from '../experience-bookings/experience-bookings.module';
import { ExperiencesModule } from '../experiences/experiences.module';
import { GuideApplicationsModule } from '../guide-applications/guide-applications.module';
import { GuideModule } from '../guide/guide.module';
import { PlansModule } from '../plans/plans.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { TripsModule } from '../trips/trips.module';
import { ExperienceGuidesController } from './experience-guides.controller';
import { ExperienceGuidesService } from './experience-guides.service';

@Module({
  imports: [
    ExperienceBookingsModule,
    ExperiencesModule,
    GuideApplicationsModule,
    GuideModule,
    PlansModule,
    ReviewsModule,
    TripsModule,
  ],
  controllers: [ExperienceGuidesController],
  providers: [ExperienceGuidesService],
})
export class ExperienceGuidesModule {}
