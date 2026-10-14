import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '../auth/entities/auth.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleRepository } from './schedule.repository';

const isAdmin = (role?: string) => role === Role.SUPERADMIN || role === Role.NONTECHADMIN;

@Injectable()
export class ScheduleService {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  create(dto: CreateScheduleDto, actor?: { userId?: string; role?: string }) {
    if (!isAdmin(actor?.role) && dto.guideId !== actor?.userId) {
      throw new ForbiddenException('You can only add items to your own schedule.');
    }
    return this.scheduleRepository.create(dto);
  }

  findAll(guideId: string | undefined, actor?: { userId?: string; role?: string }) {
    if (isAdmin(actor?.role)) return this.scheduleRepository.findAll(guideId);
    if (guideId && guideId !== actor?.userId) {
      throw new ForbiddenException('You can only view your own schedule.');
    }
    return this.scheduleRepository.findAll(actor?.userId);
  }

  findOne(id: number, actor?: { userId?: string; role?: string }) {
    const item = this.scheduleRepository.findById(id);
    if (!item) throw new NotFoundException(`Schedule item ${id} not found`);
    if (!isAdmin(actor?.role) && item.guideId !== actor?.userId) {
      throw new ForbiddenException('This schedule item belongs to another guide.');
    }
    return item;
  }

  update(id: number, dto: UpdateScheduleDto, actor?: { userId?: string; role?: string }) {
    this.findOne(id, actor);
    if (dto.guideId !== undefined && !isAdmin(actor?.role)) {
      throw new ForbiddenException('A schedule item cannot be moved to another guide.');
    }
    const updated = this.scheduleRepository.update(id, dto);
    if (!updated) throw new NotFoundException(`Schedule item ${id} not found`);
    return updated;
  }

  remove(id: number, actor?: { userId?: string; role?: string }) {
    this.findOne(id, actor);
    const deleted = this.scheduleRepository.delete(id);
    if (!deleted) throw new NotFoundException(`Schedule item ${id} not found`);
    return { message: `Schedule item ${id} deleted` };
  }
}
