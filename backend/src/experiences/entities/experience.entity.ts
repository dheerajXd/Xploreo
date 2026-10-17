export enum ExperienceCategory {
  ADVENTURE = 'adventure',
  CULTURAL = 'culture',
  CULINARY = 'culinary',
  WELLNESS = 'wellness',
  WILDLIFE = 'wildlife',
  PHOTOGRAPHY = 'photography',
}

export enum ExperienceAvailability {
  AVAILABLE = 'available',
  NOT_AVAILABLE = 'unavailable',
}

export class Experience {
  id!: string;
  partnerId!: string;
  title!: string;
  description!: string;
  destination!: string;
  category!: ExperienceCategory;
  availability!: ExperienceAvailability;
  price!: number;
  durationHours!: number;
  capacity!: number;
  booked!: number;
  image!: string;
  nextSlot!: string;
  slots!: Array<{
    id: string;
    date: string;
    time: string;
    booked: number;
    capacity: number;
    available: boolean;
  }>;
}
