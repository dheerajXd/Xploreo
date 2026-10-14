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
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiProtectedResource()
@Roles(
  Role.TRAVELLER,
  Role.GUIDE,
  Role.HOTEL,
  Role.EXPERIENCE,
  Role.SUPERADMIN,
  Role.NONTECHADMIN,
)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review' })
  @ApiCreateEndpoint(CreateReviewDto)
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get reviews, scoped to the signed-in partner/guide where applicable' })
  @ApiQuery({ name: 'hotelId', required: false })
  @ApiReadEndpoint()
  findAll(@Req() req: any, @Query('hotelId') hotelId?: string) {
    return this.reviewsService.findForUser(req.user?.userId, req.user?.role, hotelId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiReadEndpoint()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiUpdateEndpoint(UpdateReviewDto)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiDeleteEndpoint()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.remove(id);
  }
}
