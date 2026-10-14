import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'hotel-goa-001' })
  @IsString()
  hotelId!: string;

  @ApiProperty({ example: 'Anjali Sharma' })
  @IsString()
  @MaxLength(120)
  guestName!: string;

  @ApiProperty({ example: 'anjali@example.com' })
  @IsString()
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: '+91 9876543210' })
  @IsString()
  @MaxLength(40)
  phone!: string;

  @ApiProperty({ example: '2026-06-10' })
  @IsDateString()
  checkIn!: string;

  @ApiProperty({ example: '2026-06-12' })
  @IsDateString()
  checkOut!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  guests!: number;

  @ApiProperty({ example: 'Deluxe Room' })
  @IsString()
  roomType!: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  rooms?: number;

  @ApiPropertyOptional({ example: ['Anjali Sharma'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  guestNames?: string[];

  @ApiPropertyOptional({ example: 'Late check-in requested.' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  notes?: string;
}
