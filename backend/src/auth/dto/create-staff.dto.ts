import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { STAFF_ROLES, Role } from '../entities/auth.entity';
import { IsPhone } from '../../common/validators/is-phone';

// Admin Management — Super Admin creates a Regional (NonTechAdmin) or Tech Admin account.
// A Super Admin account can never be created through the API; the only ones that exist are the
// seeded ones, which keeps "who can make a Super Admin" out of reach of any endpoint entirely.
export class CreateStaffDto {
  @ApiProperty({ example: 'nta_kochi' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Vikram Nair' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'vikram.nair@xploreo.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '9123456780' })
  @IsPhone()
  phone!: string;

  @ApiProperty({ enum: STAFF_ROLES, example: Role.NONTECHADMIN })
  @IsIn(STAFF_ROLES)
  role!: Role;

  // Required for a regional admin (their assigned region); ignored for a tech admin.
  @ApiPropertyOptional({ example: 'Kerala' })
  @IsOptional()
  @IsString()
  region?: string;
}
