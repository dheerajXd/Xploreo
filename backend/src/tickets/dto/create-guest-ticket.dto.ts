import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TicketPriority } from '../entities/ticket.entity';

// Used by the public "contact support" form for visitors who cannot sign in — most notably
// someone whose account was restricted and is blocked before a session is ever issued.
export class CreateGuestTicketDto {
  @ApiProperty({ example: 'Anjali Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'anjali@xploreo.com' })
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: 'My account was restricted' })
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  subject!: string;

  @ApiProperty({ example: 'I tried to log in and was told my account is restricted. Please help.' })
  @IsString()
  @MinLength(10)
  @MaxLength(1200)
  message!: string;

  @ApiPropertyOptional({ example: 'Account Access' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.HIGH })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
