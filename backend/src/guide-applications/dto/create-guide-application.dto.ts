import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

// A guide applies to lead either a travel plan or a single experience — exactly one of planId /
// experienceId must be given (enforced in GuideApplicationsService#create, since "exactly one of
// two optional fields" isn't a single built-in class-validator decorator).
export class CreateGuideApplicationDto {
  @ApiPropertyOptional({ example: 'plan-001' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ example: 'exp-001' })
  @IsOptional()
  @IsString()
  experienceId?: string;

  @ApiPropertyOptional({ example: 1500, minimum: 0 })
  @IsNumber()
  @Min(0)
  guidePricePerPerson!: number;
}
