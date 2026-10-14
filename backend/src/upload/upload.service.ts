import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type UploadedFileResult = {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
};

@Injectable()
export class UploadService {
  process(file: Express.Multer.File | undefined): UploadedFileResult {
    if (!file) {
      throw new BadRequestException('No file uploaded', { cause: { file: 'No file uploaded' } });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, GIF, WebP are allowed.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Maximum size is 5MB.');
    }

    const url = `/uploads/images/${file.filename}`;
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: url,
      url,
    };
  }

  processMany(files: Express.Multer.File[] | undefined): UploadedFileResult[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    if (files.length > 5) {
      throw new BadRequestException('A maximum of 5 files can be uploaded at once.');
    }
    return files.map((file) => this.process(file));
  }

  static generatedFilename(originalName: string): string {
    const ext = extname(originalName) || '.jpg';
    return `${randomUUID()}${ext}`;
  }
}
