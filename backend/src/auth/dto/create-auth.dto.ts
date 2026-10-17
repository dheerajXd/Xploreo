import {
  IsIn,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OPERATIONAL_ROLES, Role } from '../entities/auth.entity';

import { IsPhone } from '../../common/validators/is-phone';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Anjali Sharma' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'anjali@xploreo.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '9123456780' })
  @IsPhone()
  phone!: string;

  // Self-signup is only ever one of the operational roles — see OPERATIONAL_ROLES. An admin
  // account (regional/tech/super admin) can only be created by a Super Admin, via POST /auth/staff.
  @ApiProperty({ enum: OPERATIONAL_ROLES, example: Role.TRAVELLER })
  @IsIn(OPERATIONAL_ROLES)
  role!: Role;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  location?: string;
}

