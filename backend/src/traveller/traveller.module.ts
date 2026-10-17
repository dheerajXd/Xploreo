import { Module } from '@nestjs/common';
import { TravellerService } from './traveller.service';
import { TravellerController } from './traveller.controller';
import { TravellerRepository } from './traveller.repository';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [TripsModule],
  controllers: [TravellerController],
  providers: [TravellerService, TravellerRepository],
  exports: [TravellerRepository],
})
export class TravellerModule {}
