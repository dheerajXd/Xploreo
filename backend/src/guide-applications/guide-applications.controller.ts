import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/entities/auth.entity';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ApiCreateEndpoint,
  ApiProtectedResource,
  ApiReadEndpoint,
} from '../common/decorators/api-docs.decorator';
import { CreateGuideApplicationDto } from './dto/create-guide-application.dto';
import { GuideApplicationsService } from './guide-applications.service';

@ApiTags('Guide Applications')
@ApiProtectedResource()
@Roles(Role.GUIDE)
@Controller('guide-applications')
export class GuideApplicationsController {
  constructor(private readonly service: GuideApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Guide applies to lead a plan' })
  @ApiCreateEndpoint(CreateGuideApplicationDto)
  create(@Body() dto: CreateGuideApplicationDto, @Req() req: any) {
    return this.service.create(req.user?.userId, dto);
  }

  @Get('guide/:guideId')
  @ApiOperation({ summary: "Guide's own applications" })
  @ApiReadEndpoint()
  findForGuide(@Param('guideId') guideId: string, @Req() req: any) {
    return this.service.findForGuide(guideId, req.user?.userId);
  }
}
