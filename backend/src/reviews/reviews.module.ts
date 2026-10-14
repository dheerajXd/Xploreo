import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { HotelsModule } from '../hotels/hotels.module';
import { ExperiencesModule } from '../experiences/experiences.module';

@Module({
  imports: [HotelsModule, ExperiencesModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
