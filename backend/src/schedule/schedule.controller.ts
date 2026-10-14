import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/entities/auth.entity';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ApiCreateEndpoint,
  ApiDeleteEndpoint,
  ApiProtectedResource,
  ApiReadEndpoint,
  ApiUpdateEndpoint,
} from '../common/decorators/api-docs.decorator';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleService } from './schedule.service';

@ApiTags('Schedule')
@ApiProtectedResource()
@Roles(Role.GUIDE, Role.SUPERADMIN, Role.NONTECHADMIN)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a schedule item' })
  @ApiCreateEndpoint(CreateScheduleDto)
  create(@Body() dto: CreateScheduleDto, @Req() req: any) {
    return this.scheduleService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: "Get schedule items (scoped to the guide's own schedule)" })
  @ApiReadEndpoint()
  @ApiQuery({ name: 'guideId', required: false })
  findAll(@Query('guideId') guideId: string | undefined, @Req() req: any) {
    return this.scheduleService.findAll(guideId, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule item by ID' })
  @ApiReadEndpoint()
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.scheduleService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a schedule item' })
  @ApiUpdateEndpoint(UpdateScheduleDto)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
    @Req() req: any,
  ) {
    return this.scheduleService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a schedule item' })
  @ApiDeleteEndpoint()
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.scheduleService.remove(id, req.user);
  }
}
