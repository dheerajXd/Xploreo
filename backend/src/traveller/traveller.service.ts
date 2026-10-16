import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TravellerRepository } from './traveller.repository';
import { CreateTravellerDto } from './dto/create-traveller.dto';
import { UpdateTravellerDto } from './dto/update-traveller.dto';

@Injectable()
export class TravellerService {
  constructor(private readonly travellerRepository: TravellerRepository) {}

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

    // If caller is not self or admin, redact private contact information
    if (!isSelf && !isAdmin) {
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
