import { Entity, Column, Check } from 'typeorm';
import { BaseEntity } from './base.entity';

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

@Entity({ name: 'ingest_job' })
@Check(
  `"status" IN ('uploaded','processing','queued','initiated','complete','failed','stale','duplicate')`,
)
export class IngestJobEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'upload_id' })
  uploadId: string | null;

  @Column({ type: 'text', nullable: true, name: 'filename' })
  fileName: string | null;

  @Column({ type: 'text', nullable: true, name: 'file_type' })
  fileType: string | null;

  @Column({ type: 'text', nullable: true, name: 'data_name' })
  dataName: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'schema_id' })
  schemaId: string | null;
  
  @Column({ type: 'text', nullable: true, name: 'file_path' })
  filePath: string | null;

  @Column({ type: 'text', nullable: true, name: 'content_sha256' })
  contentSha256: string | null;

  @Column({
    type: 'enum',
    enum: IngestJobStatus,
    default: IngestJobStatus.INITIATED,
    name: 'status',
  })
  status: IngestJobStatus;

  @Column({ type: 'bigint', nullable: true, name: 'size_bytes' })
  sizeBytes: string | null;
}
