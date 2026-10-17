import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegisterDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(RegisterDto) {
  @ApiPropertyOptional({ enum: ['active', 'inactive'], example: 'inactive' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  // Not on RegisterDto (self-signup never sets it) — only a Super Admin reassigns a regional
  // admin's region, through Admin Management.
  @ApiPropertyOptional({ example: 'Kerala' })
  @IsOptional()
  @IsString()
  region?: string;
}
