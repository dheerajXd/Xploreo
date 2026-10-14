import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateGuideApplicationDto {
  @ApiProperty({ example: 'plan-001' })
  @IsString()
  planId!: string;

  @ApiProperty({ example: 1500, minimum: 0 })
  @IsNumber()
  @Min(0)
  guidePricePerPerson!: number;
}
