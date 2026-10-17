import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DecideGuideApplicationDto {
  @ApiProperty({ enum: ['accepted', 'rejected'] })
  @IsIn(['accepted', 'rejected'])
  status!: 'accepted' | 'rejected';

  @ApiPropertyOptional({ example: 'Missing regional accreditation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
