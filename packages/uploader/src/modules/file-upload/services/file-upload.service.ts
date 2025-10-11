import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Service, UploadedFileVersion } from './s3.service';
import {
  TenantService,
  IngestJobService,
  IngestJobEntity,
  DataSchemaService,
} from '@data-ingestion/shared';
import { InitiateUploadDto, IngestJobListDto, IngestJobDto } from '../dto';
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

  async getIngestionJobsByTenant(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<IngestJobListDto> {
    const skip = (page - 1) * limit;

    const [items, total] = await this.ingestJobService.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const dtos = items.map(
      (item) =>
        new IngestJobDto({
          id: item.id,
          tenantId: item.tenantId,
          uploadId: item.uploadId,
          fileName: item.fileName,
          fileType: item.fileType,
          filePath: item.filePath,
          contentSha256: item.contentSha256,
          status: item.status,
          sizeBytes: item.sizeBytes,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
    );

    return new IngestJobListDto(dtos, total, page, limit);
  }

  /**
   * Initiate a file upload, generate a presigned url for the file and create an ingest job
   * - the same signed URL cannot be used for multiple uploads, and the upload must be completed within the expiration time
   * - the ingest job is created with the default status INITIATED
   * - if the user does not use the generated presigned url, the ingest job status will be updated to STALE
   * - the tenant and schema must exist in the database before initiating the upload
   *
   * @param payload - The payload containing the file name, file type, tenant id, data name, and schema id
   * @returns The upload metadata containing the upload id, original file name, s3 key, and presigned url
   */
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
