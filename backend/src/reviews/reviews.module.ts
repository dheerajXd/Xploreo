import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { HotelsModule } from '../hotels/hotels.module';
import { ExperiencesModule } from '../experiences/experiences.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [HotelsModule, ExperiencesModule, TripsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
