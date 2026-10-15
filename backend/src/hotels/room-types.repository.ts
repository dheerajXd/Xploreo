import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RoomType } from './entities/room-type.entity';
import { stripUndefined } from '../common/utils/strip-undefined';

@Injectable()
export class RoomTypesRepository {
  private readonly roomTypes: RoomType[] = [
    {
      id: 'room-hp001-deluxe',
      hotelId: 'hotel-hp001-1',
      type: 'Deluxe Room',
      description: 'Spacious room with a king bed and courtyard view.',
      pricePerNight: 4500,
      maxOccupancy: 3,
      totalRooms: 10,
      availableRooms: 10,
      amenities: ['WiFi', 'Air Conditioning', 'TV'],
      images: [],
    },
    {
      id: 'room-hp001-suite',
      hotelId: 'hotel-hp001-1',
      type: 'Royal Suite',
      description: 'Two-room suite with a private balcony.',
      pricePerNight: 8500,
      maxOccupancy: 4,
      totalRooms: 5,
      availableRooms: 5,
      amenities: ['WiFi', 'Air Conditioning', 'Mini Bar', 'Balcony'],
      images: [],
    },
  ];

  create(
    hotelId: string,
    data: Omit<RoomType, 'id' | 'hotelId' | 'availableRooms'> & { id?: string },
  ): RoomType {
    const rt: RoomType = {
      id: data.id || randomUUID(),
      hotelId,
      type: data.type,
      description: data.description ?? '',
      pricePerNight: data.pricePerNight,
      maxOccupancy: data.maxOccupancy,
      totalRooms: data.totalRooms,
      availableRooms: data.totalRooms,
      amenities: data.amenities ?? [],
      images: data.images ?? [],
      status: data.status ?? 'active',
    };
    this.roomTypes.push(rt);
    return this.clone(rt);
  }

  findByHotelId(hotelId: string): RoomType[] {
    return this.roomTypes.filter((r) => r.hotelId === hotelId).map((r) => this.clone(r));
  }

  findById(id: string): RoomType | undefined {
    const rt = this.roomTypes.find((r) => r.id === id);
    return rt ? this.clone(rt) : undefined;
  }

  findRawById(id: string): RoomType | undefined {
    return this.roomTypes.find((r) => r.id === id);
  }

  existsByType(hotelId: string, type: string): boolean {
    return this.roomTypes.some(
      (r) => r.hotelId === hotelId && r.type.toLowerCase() === type.toLowerCase(),
    );
  }

  update(id: string, data: Partial<RoomType>): RoomType | undefined {
    const index = this.roomTypes.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    const patch = stripUndefined(data);
    this.roomTypes[index] = {
      ...this.roomTypes[index],
      ...patch,
      amenities: patch.amenities ?? this.roomTypes[index].amenities,
      images: patch.images ?? this.roomTypes[index].images,
    };
    return this.clone(this.roomTypes[index]);
  }

  setAvailableRooms(id: string, availableRooms: number): void {
    const rt = this.roomTypes.find((r) => r.id === id);
    if (rt) rt.availableRooms = Math.max(0, availableRooms);
  }

  delete(id: string): boolean {
    const index = this.roomTypes.findIndex((r) => r.id === id);
    if (index === -1) return false;
    this.roomTypes.splice(index, 1);
    return true;
  }

  private clone(rt: RoomType): RoomType {
    return { ...rt, amenities: [...rt.amenities], images: [...rt.images] };
  }
}
