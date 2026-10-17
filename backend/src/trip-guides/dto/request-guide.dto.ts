import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RequestGuideDto {
  @ApiProperty({ example: 'G001' })
  @IsString()
  @MinLength(1)
  guideId!: string;
}
