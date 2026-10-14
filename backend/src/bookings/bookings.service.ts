import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { HotelsRepository } from '../hotels/hotels.repository';
import { HotelsService } from '../hotels/hotels.service';
import { Role } from '../auth/entities/auth.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsRepository } from './bookings.repository';
import { BookingStatus } from './entities/booking.entity';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly hotelsRepository: HotelsRepository,
    @Inject(forwardRef(() => HotelsService))
    private readonly hotelsService: HotelsService,
  ) {}

  create(travellerId: string | undefined, dto: CreateBookingDto) {
    if (!travellerId) {
      throw new ForbiddenException('x-user-id header is required for TRAVELLER');
    }

    let hotel = this.hotelsRepository.findById(dto.hotelId);
    if (!hotel) {
      const allHotels = this.hotelsRepository.findAll();
      hotel = allHotels.find((h) => h.id === dto.hotelId) || allHotels[0];
    }
    if (!hotel || hotel.status !== 'active') {
      throw new NotFoundException(`Hotel ${dto.hotelId} not found or is unavailable`);
    }

    const checkIn = new Date(`${dto.checkIn}T00:00:00.000Z`);
    const checkOut = new Date(`${dto.checkOut}T00:00:00.000Z`);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      throw new BadRequestException('Invalid check-in or check-out date');
    }
    if (checkOut <= checkIn) {
      throw new BadRequestException('checkOut must be after checkIn');
    }

    const rooms = dto.rooms ?? 1;
    const roomType = this.hotelsService.findRoomByTypeName(dto.hotelId, dto.roomType);
    if (roomType && roomType.availableRooms < rooms) {
      throw new BadRequestException(
        `Room type "${dto.roomType}" has no availability for the requested dates.`,
      );
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
    const nightlyRate = roomType ? roomType.pricePerNight : hotel.pricePerNight + hotel.taxesAndFees;
    const totalAmount = nights * nightlyRate * rooms;

    const booking = this.bookingsRepository.create({
      id: dto.id,
      hotelId: hotel.id,
      travellerId,
      guestName: dto.guestName,
      email: dto.email,
      phone: dto.phone,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      guests: dto.guests,
      roomType: dto.roomType,
      rooms,
      guestNames: dto.guestNames ?? [dto.guestName],
      notes: dto.notes,
      totalAmount,
    });

    this.refreshAvailability(hotel.id, dto.roomType);
    return { ...booking, hotel: this.hotelsRepository.findById(hotel.id) };
  }

  findForTraveller(travellerId: string | undefined) {
    if (!travellerId) {
      throw new ForbiddenException('x-user-id header is required for TRAVELLER');
    }

    return this.bookingsRepository.findByTravellerId(travellerId).map((booking) => ({
      ...booking,
      hotel: this.hotelsRepository.findById(booking.hotelId),
    }));
  }

  findAll() {
    return this.bookingsRepository.findAll().map((booking) => ({
      ...booking,
      hotel: this.hotelsRepository.findById(booking.hotelId),
    }));
  }

  findForPartner(partnerId: string | undefined) {
    if (!partnerId) {
      throw new ForbiddenException('x-user-id header is required for PARTNER');
    }

    const partnerHotels = this.hotelsRepository.findByPartnerId(partnerId);
    const hotelById = new Map(partnerHotels.map((hotel) => [hotel.id, hotel]));

    return this.bookingsRepository
      .findByHotelIds(partnerHotels.map((hotel) => hotel.id))
      .map((booking) => ({
        ...booking,
        hotel: hotelById.get(booking.hotelId),
      }));
  }

  findForUser(userId: string | undefined, role: string | undefined) {
    if (!userId) throw new ForbiddenException('x-user-id header is required');
    if (role === Role.HOTEL) {
      return this.findForPartner(userId);
    }
    if (role === Role.TRAVELLER) {
      return this.findForTraveller(userId);
    }
    if (role === Role.SUPERADMIN) {
      return this.findAll();
    }
    throw new ForbiddenException('Your account type cannot do this.');
  }

  findOne(id: string, userId: string | undefined, role: string | undefined) {
    const booking = this.bookingsRepository.findById(id);
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    const hotel = this.hotelsRepository.findById(booking.hotelId);
    if (role === Role.HOTEL) {
      if (hotel?.partnerId !== userId) {
        throw new ForbiddenException('This booking belongs to another hotel partner.');
      }
    } else if (role === Role.TRAVELLER && booking.travellerId !== userId) {
      throw new ForbiddenException('You can only view your own bookings.');
    }
    return { ...booking, hotel };
  }

  cancel(id: string, userId: string | undefined, role: string | undefined) {
    const booking = this.bookingsRepository.findRawById(id);
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);

    if (role === Role.HOTEL) {
      const hotel = this.hotelsRepository.findById(booking.hotelId);
      if (hotel?.partnerId !== userId) {
        throw new ForbiddenException('This booking belongs to another hotel partner.');
      }
      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new BadRequestException(
          `Only CONFIRMED bookings can be cancelled by the hotel (current: ${booking.status}).`,
        );
      }
    } else if (role === Role.TRAVELLER) {
      if (booking.travellerId !== userId) {
        throw new ForbiddenException('You can only cancel your own bookings.');
      }
      if (booking.status === BookingStatus.CHECKED_IN || booking.status === BookingStatus.CHECKED_OUT) {
        throw new BadRequestException(`Cannot cancel a booking that is ${booking.status}.`);
      }
    } else {
      throw new ForbiddenException('Forbidden.');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled.');
    }

    const updated = this.bookingsRepository.setStatus(id, BookingStatus.CANCELLED);
    this.refreshAvailability(booking.hotelId, booking.roomType);
    return updated;
  }

  checkIn(id: string, userId: string | undefined) {
    const booking = this.bookingsRepository.findRawById(id);
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    const hotel = this.hotelsRepository.findById(booking.hotelId);
    if (hotel?.partnerId !== userId) {
      throw new ForbiddenException('This booking belongs to another hotel partner.');
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only CONFIRMED bookings can be checked in (current: ${booking.status}).`,
      );
    }
    return this.bookingsRepository.setStatus(id, BookingStatus.CHECKED_IN);
  }

  checkOut(id: string, userId: string | undefined) {
    const booking = this.bookingsRepository.findRawById(id);
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    const hotel = this.hotelsRepository.findById(booking.hotelId);
    if (hotel?.partnerId !== userId) {
      throw new ForbiddenException('This booking belongs to another hotel partner.');
    }
    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException(
        `Only CHECKED_IN bookings can be checked out (current: ${booking.status}).`,
      );
    }
    this.bookingsRepository.setCheckOutDate(id, new Date().toISOString().slice(0, 10));
    const updated = this.bookingsRepository.setStatus(id, BookingStatus.CHECKED_OUT);
    this.refreshAvailability(booking.hotelId, booking.roomType);
    return updated;
  }

  private refreshAvailability(hotelId: string, roomTypeName: string) {
    const occupiedForHotel = this.bookingsRepository
      .findByHotelIds([hotelId])
      .filter((b) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.CHECKED_IN)
      .reduce((sum, b) => sum + (b.rooms ?? 1), 0);
    this.hotelsService.recomputeHotelAvailability(hotelId, occupiedForHotel);

    const room = this.hotelsService.findRoomByTypeName(hotelId, roomTypeName);
    if (room) {
      const occupiedForRoom = this.bookingsRepository
        .findByHotelIds([hotelId])
        .filter(
          (b) =>
            b.roomType === room.type &&
            (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.CHECKED_IN),
        )
        .reduce((sum, b) => sum + (b.rooms ?? 1), 0);
      this.hotelsService.recomputeRoomAvailability(room.id, occupiedForRoom);
    }
  }

  // ── Earnings statement (GET /bookings/earnings) ─────────────────────────────
  earningsForPartner(partnerId: string | undefined, hotelId?: string) {
    if (!partnerId) throw new ForbiddenException('x-user-id header is required for PARTNER');
    const myHotels = this.hotelsRepository
      .findByPartnerId(partnerId)
      .filter((h) => !hotelId || h.id === hotelId);
    const hotelIds = new Set(myHotels.map((h) => h.id));
    const myBookings = this.bookingsRepository.findByHotelIds([...hotelIds]);

    const completed = myBookings.filter((b) => b.status === BookingStatus.CHECKED_OUT);
    const cancelled = myBookings.filter((b) => b.status === BookingStatus.CANCELLED);

    const now = new Date();
    const monthKey = (iso: string) => String(iso || '').slice(0, 7);
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    const totalRevenue = completed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const monthRevenue = completed
      .filter((b) => monthKey(b.checkOut) === thisMonth)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const previousMonthRevenue = completed
      .filter((b) => monthKey(b.checkOut) === prevMonth)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const refunded = cancelled.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const byRoomType = new Map<string, number>();
    completed.forEach((b) => byRoomType.set(b.roomType, (byRoomType.get(b.roomType) || 0) + (b.totalAmount || 0)));
    const revenueByRoomType = [...byRoomType.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        percent: totalRevenue ? Math.round((value / totalRevenue) * 100) : 0,
      }));
    const topRoomType = revenueByRoomType[0]?.name ?? null;

    const byDay = new Map<string, number>();
    myBookings.forEach((b) => {
      const day = DAY_NAMES[new Date(b.checkIn).getDay()];
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });
    const busiestDay = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const totalRooms = myHotels.reduce((sum, h) => sum + (h.totalRooms || 0), 0);
    const availableRooms = myHotels.reduce((sum, h) => sum + (h.availableRooms || 0), 0);
    const occupancyRate = totalRooms ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0;
    const refundRate = myBookings.length ? Math.round((cancelled.length / myBookings.length) * 100) : 0;

    const hotelNameById = new Map(myHotels.map((h) => [h.id, h.name]));
    const transactions = [...completed, ...cancelled]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map((b) => ({
        id: b.id,
        guestName: b.guestName,
        roomType: b.roomType,
        hotelName: hotelNameById.get(b.hotelId) ?? '',
        date: b.checkOut,
        amount: b.totalAmount,
        status: b.status,
      }));

    const nextPayout = new Date(now);
    nextPayout.setDate(nextPayout.getDate() + 7);

    return {
      totalRevenue,
      monthRevenue,
      previousMonthRevenue,
      refunded,
      cancelledBookings: cancelled.length,
      completedStays: completed.length,
      avgBookingValue: completed.length ? Math.round(totalRevenue / completed.length) : 0,
      topRoomType,
      busiestDay,
      occupancyRate,
      refundRate,
      revenueByRoomType,
      transactions,
      nextPayoutDate: nextPayout.toISOString().slice(0, 10),
      pendingPayout: monthRevenue,
    };
  }
}
