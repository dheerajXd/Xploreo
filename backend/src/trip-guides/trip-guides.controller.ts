import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/entities/auth.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiProtectedResource, ApiReadEndpoint } from '../common/decorators/api-docs.decorator';
import { NonEmptyStringPipe } from '../common/pipes/non-empty-string.pipe';
import { RequestGuideDto } from './dto/request-guide.dto';
import { TripGuidesService } from './trip-guides.service';

@ApiTags('Trip Guides')
@ApiProtectedResource()
@Roles(Role.TRAVELLER, Role.SUPERADMIN)
@Controller('trips/:id')
export class TripGuidesController {
  constructor(private readonly service: TripGuidesService) {}

  @Get('available-guides')
  @ApiOperation({ summary: 'NTA-approved guides still selectable for this trip (dates + declines applied)' })
  @ApiReadEndpoint()
  available(@Param('id', NonEmptyStringPipe) id: string, @Req() req: any) {
    return this.service.availableGuides(id, req.user);
  }

  @Post('guide-request')
  @ApiOperation({ summary: 'Traveller requests a guide for the trip' })
  request(
    @Param('id', NonEmptyStringPipe) id: string,
    @Body() dto: RequestGuideDto,
    @Req() req: any,
  ) {
    return this.service.requestGuide(id, dto.guideId, req.user);
  }

  @Delete('guide-request')
  @ApiOperation({ summary: 'Traveller withdraws a pending guide request' })
  cancel(@Param('id', NonEmptyStringPipe) id: string, @Req() req: any) {
    return this.service.cancelRequest(id, req.user);
  }
}
