import { ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { TripStatus } from '../trips/entities/trip.entity';
import { TripsRepository } from '../trips/trips.repository';
import { TravellerRepository } from './traveller.repository';
import { CreateTravellerDto } from './dto/create-traveller.dto';
import { UpdateTravellerDto } from './dto/update-traveller.dto';

@Injectable()
export class TravellerService {
  constructor(
    private readonly travellerRepository: TravellerRepository,
    @Optional() private readonly tripsRepository?: TripsRepository,
  ) {}

  create(userId: string, dto: CreateTravellerDto) {
    return this.travellerRepository.create({
      userId,
      fname: dto.fname,
      lname: dto.lname,
      email: dto.email,
      phno: dto.phno,
      plang: dto.plang ?? [],
      bio: dto.bio ?? '',
      interests: dto.interests ?? [],
    });
  }

  findAll() {
    return this.travellerRepository.findAll();
  }

  findOne(id: string, actor?: { userId?: string; role?: string }) {
    const t = this.travellerRepository.findById(id);
    if (!t) throw new NotFoundException(`Traveller ${id} not found`);

    const isSelf = actor?.userId === id;
    const isAdmin = actor?.role === 'superadmin' || actor?.role === 'nontechadmin';

    // A guide who is running (or about to run) this traveller's trip needs their contact details.
    const isTripGuide =
      actor?.role === 'guide' &&
      Boolean(
        this.tripsRepository
          ?.findByGuide(actor.userId ?? '')
          .some(
            (trip) =>
              trip.travellerId === id &&
              [TripStatus.CONFIRMED, TripStatus.STARTED, TripStatus.COMPLETED].includes(trip.status),
          ),
      );

    // If caller is not self, admin or the traveller's guide, redact private contact information
    if (!isSelf && !isAdmin && !isTripGuide) {
      const { email: _email, phno: _phno, ...publicProfile } = t;
      return publicProfile;
    }

    return t;
  }

  update(id: string, dto: UpdateTravellerDto, actor?: { userId?: string; role?: string }) {
    const isAdmin = actor?.role === 'superadmin' || actor?.role === 'nontechadmin';
    if (!isAdmin && actor?.userId !== id) {
      throw new ForbiddenException('You can only update your own profile.');
    }
    const updated = this.travellerRepository.update(id, dto);
    if (!updated) throw new NotFoundException(`Traveller ${id} not found`);
    return updated;
  }

  remove(id: string) {
    const deleted = this.travellerRepository.delete(id);
    if (!deleted) throw new NotFoundException(`Traveller ${id} not found`);
    return { message: `Traveller ${id} deleted` };
  }
}
