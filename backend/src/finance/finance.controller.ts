import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/entities/auth.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiProtectedResource, ApiReadEndpoint } from '../common/decorators/api-docs.decorator';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiProtectedResource()
@Roles(Role.SUPERADMIN, Role.NONTECHADMIN)
@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Live money roll-up (superadmin: everything; NTA: own region)' })
  @ApiReadEndpoint()
  summary(@Req() req: any) {
    return this.service.summary(req.user);
  }
}
