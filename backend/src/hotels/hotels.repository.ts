import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Hotel } from './entities/hotel.entity';
import { stripUndefined } from '../common/utils/strip-undefined';

@Injectable()
export class HotelsRepository {
  // Seed so the demo hotel partner (HP001) has a property to manage. Kept 'inactive' so it
  // never shows up in traveller search results.
  private readonly hotels: Hotel[] = [
    {
      id: 'hotel-hp001-1',
      partnerId: 'HP001',
      name: 'Xploreo Heritage Inn',
      city: 'Jaipur',
      location: 'Amer Road, Jaipur, Rajasthan',
      description: 'A heritage-style stay close to the Amer Fort with modern comforts.',
      stars: 4,
      rating: 5,
      reviewCount: 1,
      pricePerNight: 4500,
      taxesAndFees: 540,
      totalRooms: 15,
      availableRooms: 15,
      image: '',
      images: [],
      amenities: ['WiFi', 'Breakfast', 'Parking', 'Air Conditioning'],
      status: 'inactive',
      isDeleted: false,
      createdAt: new Date(),
    },
  ];

  create(
    partnerId: string,
    data: Omit<Hotel, 'id' | 'partnerId' | 'createdAt' | 'isDeleted'> & {
      id?: string;
    },
  ): Hotel {
    const hotel: Hotel = {
      id: data.id || randomUUID(),
      partnerId,
      name: data.name,
      city: data.city,
      location: data.location,
      description: data.description,
      stars: data.stars,
      rating: data.rating,
      reviewCount: data.reviewCount,
      pricePerNight: data.pricePerNight,
      taxesAndFees: data.taxesAndFees,
      totalRooms: data.totalRooms,
      availableRooms: data.availableRooms,
      image: data.image,
      images: data.images,
      amenities: data.amenities,
      status: data.status,
      isDeleted: false,
      createdAt: new Date(),
    };

    this.hotels.push(hotel);
    return { ...hotel, amenities: [...hotel.amenities], images: [...hotel.images] };
  }

  findAll(filters?: { location?: string }): Hotel[] {
    const location = filters?.location?.trim().toLowerCase();
    return this.hotels
      .filter((hotel) => !hotel.isDeleted && hotel.status === 'active')
      .filter((hotel) => {
        if (!location) return true;
        return (
          hotel.location.toLowerCase().includes(location) ||
          hotel.city.toLowerCase().includes(location)
        );
      })
      .map((hotel) => this.clone(hotel));
  }

  findById(id: string): Hotel | undefined {
    const hotel = this.hotels.find((item) => item.id === id && !item.isDeleted);
    return hotel ? this.clone(hotel) : undefined;
  }

  findRawById(id: string): Hotel | undefined {
    return this.hotels.find((item) => item.id === id && !item.isDeleted);
  }

  findByPartnerId(partnerId: string): Hotel[] {
    return this.hotels
      .filter((hotel) => hotel.partnerId === partnerId && !hotel.isDeleted)
      .map((hotel) => this.clone(hotel));
  }

  update(id: string, data: Partial<Hotel>): Hotel | undefined {
    const index = this.hotels.findIndex(
      (hotel) => hotel.id === id && !hotel.isDeleted,
    );
    if (index === -1) return undefined;

    const patch = stripUndefined(data);
    this.hotels[index] = {
      ...this.hotels[index],
      ...patch,
      amenities: patch.amenities ?? this.hotels[index].amenities,
      images: patch.images ?? this.hotels[index].images,
    };

    return this.clone(this.hotels[index]);
  }

  setAvailableRooms(id: string, availableRooms: number): void {
    const hotel = this.hotels.find((item) => item.id === id);
    if (hotel) hotel.availableRooms = Math.max(0, availableRooms);
  }

  setRating(id: string, rating: number, reviewCount: number): void {
    const hotel = this.hotels.find((item) => item.id === id);
    if (hotel) {
      hotel.rating = rating;
      hotel.reviewCount = reviewCount;
    }
  }

  softDelete(id: string): boolean {
    const hotel = this.hotels.find((item) => item.id === id && !item.isDeleted);
    if (!hotel) return false;
    hotel.isDeleted = true;
    return true;
  }

  private clone(hotel: Hotel): Hotel {
    return { ...hotel, amenities: [...hotel.amenities], images: [...hotel.images] };
  }
}
