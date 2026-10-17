import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/entities/auth.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiProtectedResource, ApiReadEndpoint } from '../common/decorators/api-docs.decorator';
import { NonEmptyStringPipe } from '../common/pipes/non-empty-string.pipe';
import { RequestGuideDto } from '../trip-guides/dto/request-guide.dto';
import { ExperienceGuidesService } from './experience-guides.service';

@ApiTags('Experience Guides')
@ApiProtectedResource()
@Controller('experience-guides')
export class ExperienceGuidesController {
  constructor(private readonly service: ExperienceGuidesService) {}

  // ── Guide ──
  @Roles(Role.GUIDE)
  @Get('jobs')
  @ApiOperation({ summary: "Guide's experience-session jobs" })
  @ApiReadEndpoint()
  jobs(@Req() req: any) {
    return this.service.jobsForGuide(req.user?.userId);
  }

  @Roles(Role.GUIDE)
  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Guide confirms an experience session' })
  confirm(@Param('id', NonEmptyStringPipe) id: string, @Req() req: any) {
    return this.service.confirm(id, req.user?.userId);
  }

  @Roles(Role.GUIDE)
  @Patch(':id/reject')
  @ApiOperation({ summary: 'Guide declines an experience session' })
  reject(@Param('id', NonEmptyStringPipe) id: string, @Req() req: any) {
    return this.service.reject(id, req.user?.userId);
  }

  // ── Traveller ──
  @Roles(Role.TRAVELLER, Role.SUPERADMIN)
  @Get(':id/available')
  @ApiOperation({ summary: 'Guides the traveller can still pick for this experience booking' })
  @ApiReadEndpoint()
  available(@Param('id', NonEmptyStringPipe) id: string, @Req() req: any) {
    return this.service.availableGuides(id, req.user);
  }

  @Roles(Role.TRAVELLER)
  @Post(':id/request')
  @ApiOperation({ summary: 'Traveller requests a guide for the experience' })
  request(
    @Param('id', NonEmptyStringPipe) id: string,
    @Body() dto: RequestGuideDto,
    @Req() req: any,
  ) {
    return this.service.requestGuide(id, dto.guideId, req.user);
  }

  @Roles(Role.TRAVELLER)
  @Delete(':id/request')
  @ApiOperation({ summary: 'Traveller withdraws a pending guide request' })
  cancel(@Param('id', NonEmptyStringPipe) id: string, @Req() req: any) {
    return this.service.cancelRequest(id, req.user);
  }
}
