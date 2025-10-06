import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';
import { v4 as uuidv4 } from 'uuid';

export interface UploadMetadata {
  uploadId: string;
  originalFileName: string;
  s3Key: string;
  presignedUrl: string;
  chunkKeys: string[];
  totalChunks: number;
}

@Injectable()
export class FileUploadService {
  constructor(private s3Service: S3Service) {}

  async initiateUpload(
    fileName: string,
    tenantId: string,
  ): Promise<UploadMetadata> {
    const uploadId = uuidv4();
    const { year, month, day } = this.getDatePath();
    const s3Key = `/${year}/${month}/${day}/${tenantId}/${uploadId}/${fileName}`;

    const presignedUrl = await this.s3Service.generatePresignedUploadUrl(s3Key);

    return {
      uploadId,
      originalFileName: fileName,
      s3Key,
      presignedUrl,
      chunkKeys: [],
      totalChunks: 0,
    };
  }

  private getDatePath(): { year: number; month: number; day: number } {
    const date = new Date();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();

    return {
      year,
      month,
      day,
    };
  }
}
