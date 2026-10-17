import { Module } from '@nestjs/common';
import { GuideApplicationsController } from './guide-applications.controller';
import { GuideApplicationsService } from './guide-applications.service';
import { GuideApplicationsRepository } from './guide-applications.repository';
import { GuideModule } from '../guide/guide.module';
import { PlansModule } from '../plans/plans.module';
import { TripsModule } from '../trips/trips.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [GuideModule, PlansModule, TripsModule, ReviewsModule],
  controllers: [GuideApplicationsController],
  providers: [GuideApplicationsService, GuideApplicationsRepository],
  exports: [GuideApplicationsRepository],
})
export class GuideApplicationsModule {}
