import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiProtectedResource } from '../common/decorators/api-docs.decorator';
import { UploadService } from './upload.service';

const storage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'images'),
  filename: (_req, file, callback) => {
    callback(null, UploadService.generatedFilename(file.originalname));
  },
});

@ApiTags('Upload')
@ApiProtectedResource()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single image' })
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.process(file);
  }

  @Post('multiple')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload up to 5 images' })
  @UseInterceptors(FilesInterceptor('files', 5, { storage, limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.processMany(files);
  }
}
