import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExperiencesRepository } from './experiences.repository';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperiencesService {
  constructor(private readonly expRepository: ExperiencesRepository) {}

  create(partnerId: string | undefined, dto: CreateExperienceDto) {
    if (!partnerId) {
      throw new ForbiddenException(
        'x-user-id header is required for EXPERIENCE_PARTNER',
      );
    }

    return this.expRepository.create(partnerId, {
      ...dto,
      availability: dto.availability ?? undefined,
      booked: dto.booked ?? 0,
      image: dto.image ?? '',
      nextSlot: dto.nextSlot ?? '',
      slots: dto.slots ?? [],
    });
  }

  findAll() {
    return this.expRepository.findAll();
  }

  findForPartner(partnerId: string | undefined) {
    if (!partnerId) {
      throw new ForbiddenException(
        'x-user-id header is required for EXPERIENCE_PARTNER',
      );
    }

    return this.expRepository.findByPartnerId(partnerId);
  }

  async findOne(id: string) {
    const exp = await this.expRepository.findById(id);
    if (!exp) throw new NotFoundException(`Experience ${id} not found`);
    return exp;
  }

  findByLocation(locationId: string) {
    return this.expRepository.findByLocation(locationId);
  }

  private async ownExperience(id: string, actor?: { userId?: string; role?: string }) {
    const isAdmin = actor?.role === 'superadmin' || actor?.role === 'nontechadmin';
    const exp = await this.expRepository.findById(id);
    if (!exp) throw new NotFoundException(`Experience ${id} not found`);
    if (!isAdmin && exp.partnerId !== actor?.userId) {
      throw new ForbiddenException('This experience belongs to another partner.');
    }
    return exp;
  }

  async update(id: string, dto: UpdateExperienceDto, actor?: { userId?: string; role?: string }) {
    await this.ownExperience(id, actor);
    const updated = await this.expRepository.update(id, dto);
    if (!updated) throw new NotFoundException(`Experience ${id} not found`);
    return updated;
  }

  async remove(id: string, actor?: { userId?: string; role?: string }) {
    await this.ownExperience(id, actor);
    const deleted = await this.expRepository.delete(id);
    if (!deleted) throw new NotFoundException(`Experience ${id} not found`);
    return { message: `Experience ${id} deleted` };
  }
}
