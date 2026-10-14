import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/entities/auth.entity';
import {
  ApiCreateEndpoint,
  ApiProtectedResource,
  ApiReadEndpoint,
  ApiUpdateEndpoint,
} from '../common/decorators/api-docs.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { NonEmptyStringPipe } from '../common/pipes/non-empty-string.pipe';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Phase 3 - Support Tickets')
@ApiProtectedResource()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles(Role.TRAVELLER, Role.GUIDE, Role.HOTEL, Role.EXPERIENCE)
  @ApiOperation({ summary: 'Signed-in user creates a support ticket' })
  @ApiCreateEndpoint(CreateTicketDto)
  create(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.ticketsService.create(req.user?.userId, dto);
  }

  @Get()
  @Roles(Role.TRAVELLER, Role.GUIDE, Role.HOTEL, Role.EXPERIENCE, Role.TECHADMIN)
  @ApiOperation({ summary: "Get the caller's own tickets (technical admin sees all)" })
  @ApiReadEndpoint()
  findAll(@Req() req: any) {
    return this.ticketsService.findForUser(req.user?.userId, req.user?.role);
  }

  @Patch(':id')
  @Roles(Role.TECHADMIN)
  @ApiOperation({ summary: 'Technical admin resolves a support ticket' })
  @ApiUpdateEndpoint(ResolveTicketDto)
  resolve(
    @Param('id', NonEmptyStringPipe) id: string,
    @Body() dto: ResolveTicketDto,
    @Req() req: any,
  ) {
    return this.ticketsService.resolve(id, req.user?.userId, dto);
  }
}
