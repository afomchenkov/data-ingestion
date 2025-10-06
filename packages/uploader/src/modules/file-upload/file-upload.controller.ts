import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { FileUploadService } from './services/file-upload.service';

@Controller('files')
export class FileUploadController {
  constructor(
    private fileUploadService: FileUploadService,
  ) {}

  @Post('initiate-upload')
  async initiateUpload(@Body('fileName') fileName: string, @Body('tenantId') tenantId: string) {
    return this.fileUploadService.initiateUpload(fileName, tenantId);
  }
}
