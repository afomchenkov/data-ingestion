import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Service } from './s3.service';
import { TenantService } from '../../db/services';
import { v4 as uuidv4 } from 'uuid';

export interface UploadMetadata {
  uploadId: string;
  originalFileName: string;
  s3Key: string;
  presignedUrl: string;
}

export interface AllFilesResponse {
  files: string[];
  directories: string[];
}

const PRESIGNED_URL_EXPIRATION_TIME = 300; // 5 minutes

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly tenantService: TenantService,
  ) {}

  async getAllFiles(): Promise<AllFilesResponse> {
    return this.s3Service.listAllKeys();
  }

  async getFileVersions(key: string): Promise<any[]> {
    return this.s3Service.getFileVersions(key);
  }

  async initiateUpload(
    fileName: string,
    fileType: string,
    tenantId: string,
  ): Promise<UploadMetadata> {
    const uploadId = uuidv4();
    const { year, month, day } = this.getDatePath();
    const s3Key = `/${year}/${month}/${day}/tenant/${tenantId}/upload/${uploadId}/${fileName}.${fileType}`;

    if (await this.s3Service.checkIfFileExists(s3Key)) {
      this.logger.warn(`File already exists: ${s3Key}`);
    }

    const tenant = await this.tenantService.findOne(tenantId);
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const presignedUrl = await this.s3Service.generatePresignedUploadUrl(
      s3Key,
      PRESIGNED_URL_EXPIRATION_TIME,
    );

    this.logger.log(`Upload initiated: ${uploadId}`);
    this.logger.log(`S3 Key: ${s3Key}`);
    this.logger.log(`Presigned URL: ${presignedUrl}`);

    return {
      uploadId,
      originalFileName: fileName,
      s3Key,
      presignedUrl,
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
