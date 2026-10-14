import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ReviewTargetType {
  GUIDE = 'guide',
  HOTEL = 'hotel',
  EXPERIENCE = 'experience',
}

export class CreateReviewDto {
  @ApiProperty({ example: 20001 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ enum: ReviewTargetType, example: ReviewTargetType.GUIDE })
  @IsEnum(ReviewTargetType)
  targetType!: ReviewTargetType;

  // String, not number: hotel/experience ids are UUIDs, guide ids are their userId string.
  @ApiProperty({ example: 'hotel-goa-001' })
  @IsString()
  targetId!: string;

  @ApiPropertyOptional({ example: 'trip-kerala-completed' })
  @IsOptional()
  @IsString()
  tripId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ example: 'Excellent guide and a smooth experience.' })
  @IsString()
  comment!: string;

  @ApiPropertyOptional({ example: 'Anjali Sharma' })
  @IsOptional()
  @IsString()
  authorName?: string;
}
