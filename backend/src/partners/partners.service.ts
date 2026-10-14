import { Injectable } from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';
import { Role } from '../auth/entities/auth.entity';

@Injectable()
export class PartnersService {
  constructor(private readonly bookingsService: BookingsService) {}

  findBookings(partnerId: string | undefined) {
    return this.bookingsService.findForUser(partnerId, Role.HOTEL);
  }
}
