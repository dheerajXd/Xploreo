import { Injectable } from '@nestjs/common';
import { CreateReviewDto, ReviewTargetType } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { stripUndefined } from '../common/utils/strip-undefined';

export type Review = {
  id: number;
  userId: string;
  authorName?: string;
  targetType: ReviewTargetType;
  targetId: string;
  tripId?: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

@Injectable()
export class ReviewsRepository {
  private reviews: Review[] = [
    {
      id: 1,
      userId: 'seed-guest',
      authorName: 'Meera Nair',
      targetType: ReviewTargetType.HOTEL,
      targetId: 'hotel-hp001-1',
      rating: 5,
      comment: 'Lovely heritage feel and very helpful staff.',
      createdAt: new Date(),
    },
  ];

  private nextId = 2;

  create(dto: CreateReviewDto): Review {
    const review: Review = {
      id: this.nextId++,
      userId: dto.userId ?? '',
      authorName: dto.authorName,
      targetType: dto.targetType,
      targetId: dto.targetId,
      tripId: dto.tripId,
      rating: dto.rating,
      comment: dto.comment,
      createdAt: new Date(),
    };

    this.reviews.push(review);
    return review;
  }

  findAll(): Review[] {
    return [...this.reviews].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  findByTarget(targetType: ReviewTargetType, targetIds: string[]): Review[] {
    const idSet = new Set(targetIds);
    return this.reviews
      .filter((r) => r.targetType === targetType && idSet.has(r.targetId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findById(id: number): Review | undefined {
    return this.reviews.find((item) => item.id === id);
  }

  findByTripId(tripId: string): Review | undefined {
    return this.reviews.find((item) => item.tripId === tripId);
  }

  update(id: number, dto: UpdateReviewDto): Review | undefined {
    const index = this.reviews.findIndex((item) => item.id === id);
    if (index === -1) return undefined;

    this.reviews[index] = {
      ...this.reviews[index],
      ...stripUndefined(dto),
      id: this.reviews[index].id,
      createdAt: this.reviews[index].createdAt,
    };

    return this.reviews[index];
  }

  delete(id: number): boolean {
    const index = this.reviews.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.reviews.splice(index, 1);
    return true;
  }
}
