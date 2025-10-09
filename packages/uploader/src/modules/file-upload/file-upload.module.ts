import { Module } from '@nestjs/common';
import { DBModule } from '@data-ingestion/shared';
import { KafkaModule } from '../kafka/kafka.module';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService, S3Service, SqsFileUploadService } from './services';

@Module({
  imports: [DBModule, KafkaModule],
  controllers: [FileUploadController],
  providers: [FileUploadService, S3Service, SqsFileUploadService],
  exports: [FileUploadService, S3Service, SqsFileUploadService],
})
export class FileUploadModule {}
