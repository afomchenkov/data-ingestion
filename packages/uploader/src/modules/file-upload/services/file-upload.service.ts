import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Service, UploadedFileVersion } from './s3.service';
import {
  TenantService,
  IngestJobService,
  IngestJobEntity,
  DataSchemaService,
} from '@data-ingestion/shared';
import { InitiateUploadDto } from '../dto';
import { v4 as uuidv4 } from 'uuid';

export interface UploadMetadata {
  uploadId: string;
  originalFileName: string;
  s3Key: string;
  presignedUrl: string;
}

const PRESIGNED_URL_EXPIRATION_TIME = 300; // 5 minutes

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly tenantService: TenantService,
    private readonly ingestJobService: IngestJobService,
    private readonly dataSchemaService: DataSchemaService,
  ) {}

  async getFileVersions(key: string): Promise<UploadedFileVersion[]> {
    return this.s3Service.getFileVersions(key);
  }

  async getUploadStatus(uploadId: string): Promise<IngestJobEntity | null> {
    return this.ingestJobService.findOneByUploadId(uploadId);
  }

  async initiateUpload(payload: InitiateUploadDto): Promise<UploadMetadata> {
    const { fileName, fileType, tenantId, dataName, schemaId } = payload;
    const uploadId = uuidv4();
    const { year, month, day } = this.getDatePath();
    const s3Key = `/${year}/${month}/${day}/tenant/${tenantId}/upload/${uploadId}/${fileName}.${fileType}`;

    const tenant = await this.tenantService.findOne(tenantId);
    if (!tenant) {
      throw new BadRequestException('Tenant not found, check tenant id');
    }

    const schema = await this.dataSchemaService.findOne(schemaId);
    if (!schema) {
      throw new BadRequestException('Data schema not found, check schema id');
    }

    const presignedUrl = await this.s3Service.generatePresignedUploadUrl(
      s3Key,
      uploadId,
      tenantId,
      fileType,
      PRESIGNED_URL_EXPIRATION_TIME,
    );

    // create ingest job with default status INITIATED
    // TODO: if user does not use generated presigned url, handle job status update to STALE
    await this.ingestJobService.create({
      tenantId,
      uploadId,
      fileName,
      fileType,
      filePath: s3Key,
      schemaId,
      dataName,
    });

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
