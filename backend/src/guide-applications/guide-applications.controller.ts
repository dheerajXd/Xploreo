import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/entities/auth.entity';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ApiCreateEndpoint,
  ApiProtectedResource,
  ApiReadEndpoint,
  ApiUpdateEndpoint,
} from '../common/decorators/api-docs.decorator';
import { CreateGuideApplicationDto } from './dto/create-guide-application.dto';
import { DecideGuideApplicationDto } from './dto/decide-guide-application.dto';
import { GuideApplicationsService } from './guide-applications.service';

@ApiTags('Guide Applications')
@ApiProtectedResource()
@Roles(Role.GUIDE)
@Controller('guide-applications')
export class GuideApplicationsController {
  constructor(private readonly service: GuideApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Guide applies to lead a plan (goes to the regional NTA for review)' })
  @ApiCreateEndpoint(CreateGuideApplicationDto)
  create(@Body() dto: CreateGuideApplicationDto, @Req() req: any) {
    return this.service.create(req.user?.userId, dto);
  }

  @Roles(Role.NONTECHADMIN, Role.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'Guide applications for plans in the NTA region (all for superadmin)' })
  @ApiReadEndpoint()
  findAll(@Req() req: any) {
    return this.service.findForReviewer(req.user);
  }

  @Get('guide/:guideId')
  @ApiOperation({ summary: "Guide's own applications" })
  @ApiReadEndpoint()
  findForGuide(@Param('guideId') guideId: string, @Req() req: any) {
    return this.service.findForGuide(guideId, req.user?.userId);
  }

  @Roles(Role.NONTECHADMIN, Role.SUPERADMIN)
  @Patch(':id/decision')
  @ApiOperation({ summary: 'NTA accepts or rejects an application (an accepted one can later be rejected)' })
  @ApiUpdateEndpoint(DecideGuideApplicationDto)
  decide(@Param('id') id: string, @Body() dto: DecideGuideApplicationDto, @Req() req: any) {
    return this.service.decide(id, dto, req.user);
  }
}
