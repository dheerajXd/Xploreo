import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GuideRepository } from './guide.repository';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';

@Injectable()
export class GuideService {
  constructor(private readonly guideRepository: GuideRepository) {}

  create(userId: string, dto: CreateGuideDto) {
    return this.guideRepository.create({
      userId,
      fname: dto.fname,
      lname: dto.lname,
      email: dto.email,
      phone: dto.phone,
      location: dto.location,
      prof_title: dto.prof_title,
      years_exp: dto.years_exp,
      bio: dto.bio,
      lang_spoken: dto.lang_spoken,
      certifications: dto.certifications ?? [],
      bank_name: dto.bank_name ?? '',
      bank_acc_num_end: dto.bank_acc_num_end ?? 0,
      iban: dto.iban ?? '',
    });
  }

  findAll() {
    return this.guideRepository.findAll();
  }

  findOne(id: string) {
    const guide = this.guideRepository.findById(id);
    if (!guide) throw new NotFoundException(`Guide ${id} not found`);
    return guide;
  }

  findByLocation(locationId: string) {
    return this.guideRepository.findByLocation(locationId);
  }

  update(id: string, dto: UpdateGuideDto, actor?: { userId?: string; role?: string }) {
    const isAdmin = actor?.role === 'superadmin' || actor?.role === 'nontechadmin';
    if (!isAdmin && actor?.userId !== id) {
      throw new ForbiddenException('You can only update your own guide profile.');
    }
    const updated = this.guideRepository.update(id, dto);
    if (!updated) throw new NotFoundException(`Guide ${id} not found`);
    return updated;
  }

  remove(id: string) {
    const deleted = this.guideRepository.delete(id);
    if (!deleted) throw new NotFoundException(`Guide ${id} not found`);
    return { message: `Guide ${id} deleted` };
  }
}
