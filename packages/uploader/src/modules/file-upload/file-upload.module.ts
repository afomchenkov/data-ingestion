import { Module } from '@nestjs/common';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService, S3Service } from './services';

@Module({
  controllers: [FileUploadController],
  providers: [FileUploadService, S3Service],
})
export class FileUploadModule {}