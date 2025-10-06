import { Module } from '@nestjs/common';
import { DBModule } from '../db/db.module';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService, S3Service, SqsService } from './services';

@Module({
  imports: [DBModule],
  controllers: [FileUploadController],
  providers: [FileUploadService, S3Service, SqsService],
  exports: [FileUploadService, S3Service, SqsService],
})
export class FileUploadModule {}