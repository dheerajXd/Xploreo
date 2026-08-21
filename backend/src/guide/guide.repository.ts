import { Injectable } from '@nestjs/common';
import { Guide } from './entities/guide.entity';

@Injectable()
export class GuideRepository {
  private guides: Guide[] = [
    {
      userId: 'G001',
      fname: 'Sreekar',
      lname: '',
      email: 'sreekar@gmail.com',
      phone: 9876543210,
      location: 'Mumbai',
      prof_title: 'Senior Trek Guide',
      years_exp: 7,
      bio: 'Expert mountain guide with 7+ years experience in Western Ghats',
      lang_spoken: ['English', 'Hindi', 'Marathi'],
      certifications: ['First Aid', 'Mountain Rescue'],
      bank_name: 'HDFC Bank',
      bank_acc_num_end: 1234,
      iban: 'IN123456789012345678',
    },
  ];

  create(guide: Guide): Guide {
    this.guides.push(guide);
    return guide;
  }

  findAll(): Guide[] {
    return this.guides;
  }

  findById(userId: string): Guide | undefined {
    return this.guides.find((g) => g.userId === userId);
  }

  findByLocation(locationId: string): Guide[] {
    return this.guides.filter((g) => g.location === locationId);
  }

  update(userId: string, data: Partial<Guide>): Guide | undefined {
    const idx = this.guides.findIndex((g) => g.userId === userId);
    if (idx === -1) return undefined;
    this.guides[idx] = { ...this.guides[idx], ...data };
    return this.guides[idx];
  }

  delete(userId: string): boolean {
    const idx = this.guides.findIndex((g) => g.userId === userId);
    if (idx === -1) return false;
    this.guides.splice(idx, 1);
    return true;
  }
}
