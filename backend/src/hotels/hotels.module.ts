import { Module, forwardRef } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { HotelsRepository } from './hotels.repository';
import { RoomTypesRepository } from './room-types.repository';
import { PartnerProfileRepository } from './partner-profile.repository';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [forwardRef(() => BookingsModule)],
  controllers: [HotelsController],
  providers: [
    HotelsService,
    HotelsRepository,
    RoomTypesRepository,
    PartnerProfileRepository,
  ],
  exports: [HotelsService, HotelsRepository, RoomTypesRepository],
})
export class HotelsModule {}
