import { Controller, ForbiddenException, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/entities/auth.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiProtectedResource, ApiReadEndpoint } from '../common/decorators/api-docs.decorator';
import { NonEmptyStringPipe } from '../common/pipes/non-empty-string.pipe';
import { TripsService } from './trips.service';

// A "guide assignment" is a Trip offered to a guide, viewed through the guide's job-queue lens
// (pending confirmation / confirmed / rejected), rather than a separate record.
@ApiTags('Guide Assignments')
@ApiProtectedResource()
@Roles(Role.GUIDE)
@Controller('guide-assignments')
export class GuideAssignmentsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('guide/:guideId')
  @ApiOperation({ summary: "Guide's assigned jobs" })
  @ApiReadEndpoint()
  findForGuide(@Param('guideId', NonEmptyStringPipe) guideId: string, @Req() req: any) {
    if (guideId !== req.user?.userId) {
      throw new ForbiddenException('You can only view your own jobs.');
    }
    return this.tripsService.findAssignmentsForGuide(guideId);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Guide confirms an assigned job' })
  confirm(@Param('id', NonEmptyStringPipe) id: string, @Req() req: any) {
    return this.tripsService.confirmByGuide(id, req.user?.userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Guide rejects an assigned job' })
  reject(@Param('id', NonEmptyStringPipe) id: string, @Req() req: any) {
    return this.tripsService.rejectByGuide(id, req.user?.userId);
  }
}
