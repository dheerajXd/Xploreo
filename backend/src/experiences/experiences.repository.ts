import { Injectable } from '@nestjs/common';
import {
  Experience,
  ExperienceCategory,
  ExperienceAvailability,
} from './entities/experience.entity';
import { createId } from '../common/utils/id';
import { stripUndefined } from '../common/utils/strip-undefined';
import { loadSeedData } from '../common/utils/seed-loader';

@Injectable()
export class ExperiencesRepository {
  private experiences: Experience[] = loadSeedData<Experience>('experiences.json', [
    {
      id: 'exp-1',
      partnerId: 'XP001',
      title: 'Western Ghats Trek',
      description: 'A guided trek through the lush Western Ghats forest trail.',
      destination: 'Coorg',
      category: ExperienceCategory.ADVENTURE,
      availability: ExperienceAvailability.AVAILABLE,
      price: 1800,
      durationHours: 6,
      capacity: 15,
      booked: 9,
      image: '',
      nextSlot: '2026-10-16',
      slots: [
        { id: 'slot-1', date: '2026-10-16', time: '07:00', booked: 9, capacity: 15, available: true },
        { id: 'slot-2', date: '2026-10-22', time: '07:00', booked: 3, capacity: 15, available: true },
        { id: 'slot-3', date: '2026-09-28', time: '07:00', booked: 12, capacity: 15, available: true },
      ],
    },
    {
      id: 'exp-2',
      partnerId: 'XP001',
      title: 'Backwater Cooking Workshop',
      description: 'Hands-on Kerala backwater cuisine workshop with a local chef, followed by a shared meal.',
      destination: 'Alleppey',
      category: ExperienceCategory.CULINARY,
      availability: ExperienceAvailability.AVAILABLE,
      price: 1200,
      durationHours: 3,
      capacity: 10,
      booked: 10,
      image: '',
      nextSlot: '2026-10-16',
      slots: [
        { id: 'slot-4', date: '2026-10-16', time: '11:00', booked: 10, capacity: 10, available: false },
        { id: 'slot-5', date: '2026-10-19', time: '11:00', booked: 2, capacity: 10, available: true },
      ],
    },
    {
      id: 'exp-3',
      partnerId: 'XP001',
      title: 'Golden Hour Heritage Walk',
      description: 'A photography-focused walking tour through old-city heritage lanes at golden hour.',
      destination: 'Jaipur',
      category: ExperienceCategory.PHOTOGRAPHY,
      availability: ExperienceAvailability.AVAILABLE,
      price: 950,
      durationHours: 2,
      capacity: 12,
      booked: 2,
      image: '',
      nextSlot: '2026-10-24',
      slots: [
        { id: 'slot-6', date: '2026-10-24', time: '17:00', booked: 2, capacity: 12, available: true },
        { id: 'slot-7', date: '2026-09-05', time: '17:00', booked: 8, capacity: 12, available: true },
      ],
    },
  ]);

  create(partnerId: string, data: Partial<Experience>): Experience {
    const exp: Experience = {
      id: data.id || createId(),
      partnerId,
      title: data.title!,
      description: data.description!,
      destination: data.destination!,
      category: data.category!,
      availability: data.availability ?? ExperienceAvailability.AVAILABLE,
      price: data.price!,
      durationHours: data.durationHours!,
      capacity: data.capacity!,
      booked: data.booked ?? 0,
      image: data.image ?? '',
      nextSlot: data.nextSlot ?? '',
      slots: data.slots ?? [],
    };
    this.experiences.push(exp);
    return cloneExperience(exp);
  }

  findAll(): Experience[] {
    return [...this.experiences]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map(cloneExperience);
  }

  findById(id: string): Experience | undefined {
    const experience = this.experiences.find((e) => e.id === id);
    return experience ? cloneExperience(experience) : undefined;
  }

  findByPartnerId(partnerId: string): Experience[] {
    return this.experiences
      .filter((experience) => experience.partnerId === partnerId)
      .map(cloneExperience);
  }

  findByLocation(locationId: string): Experience[] {
    const q = locationId.toLowerCase();
    return this.experiences
      .filter((e) => e.destination.toLowerCase().includes(q))
      .map(cloneExperience);
  }

  findByCategory(category: ExperienceCategory): Experience[] {
    return this.experiences
      .filter((e) => e.category === category)
      .map(cloneExperience);
  }

  update(id: string, data: Partial<Experience>): Experience | undefined {
    const idx = this.experiences.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    this.experiences[idx] = { ...this.experiences[idx], ...stripUndefined(data) };
    return cloneExperience(this.experiences[idx]);
  }

  delete(id: string): boolean {
    const idx = this.experiences.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.experiences.splice(idx, 1);
    return true;
  }
}

function cloneExperience(experience: Experience): Experience {
  return {
    ...experience,
    slots: experience.slots.map((slot) => ({ ...slot })),
  };
}
