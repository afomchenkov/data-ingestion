import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileUploadModule } from './file-upload/file-upload.module';

@Module({
  imports: [ConfigModule.forRoot(), FileUploadModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
