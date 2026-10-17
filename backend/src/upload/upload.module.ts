import { Module } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

// Multer's diskStorage needs this directory to exist before the first upload.
mkdirSync(join(process.cwd(), 'uploads', 'images'), { recursive: true });

@Module({
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
