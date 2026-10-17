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
}
