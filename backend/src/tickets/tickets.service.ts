import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../auth/entities/auth.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
import { TicketStatus } from './entities/ticket.entity';
import { TicketsRepository } from './tickets.repository';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  create(userId: string | undefined, dto: CreateTicketDto) {
    if (!userId) {
      throw new ForbiddenException('x-user-id header is required');
    }

    return this.ticketsRepository.create({
      travellerId: userId,
      travellerName: userId,
      subject: dto.subject.trim(),
      message: dto.message.trim(),
      category: dto.category?.trim() || 'General',
      priority: dto.priority,
    });
  }

  findForUser(userId: string | undefined, role: string | undefined) {
    if (role === Role.TECHADMIN) return this.ticketsRepository.findAll();
    if (!userId) throw new ForbiddenException('x-user-id header is required');
    return this.ticketsRepository.findAll().filter((t) => t.travellerId === userId);
  }

  resolve(id: string, techAdminId: string | undefined, dto: ResolveTicketDto) {
    if (!techAdminId) {
      throw new ForbiddenException(
        'x-user-id header is required for TECH_ADMIN',
      );
    }

    const ticket = this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    if (ticket.status === TicketStatus.RESOLVED) {
      throw new BadRequestException('Ticket is already resolved');
    }

    return this.ticketsRepository.resolve(id, {
      resolvedBy: techAdminId,
      resolution: dto.resolution?.trim() || 'Resolved by technical admin',
    });
  }
}
