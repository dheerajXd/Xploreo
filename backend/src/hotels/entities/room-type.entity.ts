export class RoomType {
  id!: string;
  hotelId!: string;
  type!: string;
  description!: string;
  pricePerNight!: number;
  maxOccupancy!: number;
  totalRooms!: number;
  availableRooms!: number;
  amenities!: string[];
  images!: string[];
  status?: 'active' | 'inactive';
}
