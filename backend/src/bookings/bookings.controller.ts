import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/entities/auth.entity';
import {
  ApiCreateEndpoint,
  ApiProtectedResource,
} from '../common/decorators/api-docs.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('Phase 1 - Hotel Bookings')
@ApiProtectedResource()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.TRAVELLER)
  @ApiOperation({ summary: 'Traveller books a hotel' })
  @ApiCreateEndpoint(CreateBookingDto)
  create(@Body() dto: CreateBookingDto, @Req() req: any) {
    return this.bookingsService.create(req.user?.userId, dto);
  }
}
