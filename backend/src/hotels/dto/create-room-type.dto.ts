import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRoomTypeDto {
  @ApiPropertyOptional({ example: 'rt-goa-001' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Deluxe Room' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ example: 'Sea-facing room with a king bed.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5800, minimum: 0 })
  @IsNumber()
  @Min(0)
  pricePerNight!: number;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  maxOccupancy!: number;

  @ApiProperty({ example: 10, minimum: 0 })
  @IsInt()
  @Min(0)
  totalRooms!: number;

  @ApiPropertyOptional({ example: ['AC', 'WiFi'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: ['https://example.com/room.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ enum: ['active', 'inactive'], example: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
