import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CreateRoomTypeDto } from './create-room-type.dto';

export class UpdateRoomTypeDto extends PartialType(CreateRoomTypeDto) {
  @IsOptional()
  @IsInt()
  @Min(0)
  availableRooms?: number;
}
