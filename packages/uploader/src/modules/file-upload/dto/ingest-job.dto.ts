import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export enum IngestJobStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  QUEUED = 'queued',
  INITIATED = 'initiated',
  COMPLETE = 'complete',
  FAILED = 'failed',
  STALE = 'stale',
  DUPLICATE = 'duplicate',
}

@Exclude()
export class IngestJobDto {
  @ApiProperty({ description: 'Ingest job ID', format: 'uuid' })
  @Expose()
  id: string;

  @ApiPropertyOptional({
    description: 'Tenant ID',
    format: 'uuid',
    nullable: true,
  })
  @Expose()
  tenantId: string | null;

  @ApiPropertyOptional({
    description: 'Upload ID',
    format: 'uuid',
    nullable: true,
  })
  @Expose()
  uploadId: string | null;

  @ApiPropertyOptional({ description: 'File name', nullable: true })
  @Expose()
  fileName: string | null;

  @ApiPropertyOptional({ description: 'File type', nullable: true })
  @Expose()
  fileType: string | null;

  @ApiPropertyOptional({ description: 'File path', nullable: true })
  @Expose()
  filePath: string | null;

  @ApiPropertyOptional({ description: 'Content SHA256 hash', nullable: true })
  @Expose()
  contentSha256: string | null;

  @ApiProperty({
    description: 'Ingest job status',
    enum: IngestJobStatus,
    enumName: 'IngestJobStatus',
  })
  @Expose()
  status: IngestJobStatus;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    type: 'string',
    nullable: true,
    example: '1048576',
  })
  @Expose()
  sizeBytes: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: string;

  constructor(partial: Partial<IngestJobDto>) {
    Object.assign(this, partial);
  }
}

export class IngestJobListDto {
  @ApiProperty({ type: [IngestJobDto] })
  items: IngestJobDto[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  constructor(
    items: IngestJobDto[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}
