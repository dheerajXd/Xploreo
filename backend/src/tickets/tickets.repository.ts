import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Ticket, TicketPriority, TicketStatus } from './entities/ticket.entity';
import { loadSeedData } from '../common/utils/seed-loader';

type CreateTicketRecord = {
  travellerId: string;
  travellerName: string;
  subject: string;
  message: string;
  category?: string;
  priority?: TicketPriority;
};

@Injectable()
export class TicketsRepository {
  private readonly tickets: Ticket[] = loadSeedData<any>('tickets.json').map((t) => ({
    ...t,
    createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
    resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : undefined,
  }));

  create(data: CreateTicketRecord): Ticket {
    const ticket: Ticket = {
      id: randomUUID(),
      ...data,
      category: data.category || 'General',
      priority: data.priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      createdAt: new Date(),
    };

    this.tickets.push(ticket);
    return { ...ticket };
  }

  findAll(): Ticket[] {
    return this.tickets.map((ticket) => ({ ...ticket }));
  }

  findById(id: string): Ticket | undefined {
    const ticket = this.tickets.find((item) => item.id === id);
    return ticket ? { ...ticket } : undefined;
  }

  resolve(
    id: string,
    data: Pick<Ticket, 'resolution' | 'resolvedBy'>,
  ): Ticket | undefined {
    const ticket = this.tickets.find((item) => item.id === id);
    if (!ticket) return undefined;

    ticket.status = TicketStatus.RESOLVED;
    ticket.resolvedAt = new Date();
    ticket.resolution = data.resolution;
    ticket.resolvedBy = data.resolvedBy;

    return { ...ticket };
  }
}
