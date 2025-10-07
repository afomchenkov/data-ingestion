import { Entity, Column, Check } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum IngestJobStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  QUEUED = 'queued',
  INITIATED = 'initiated',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

@Entity({ name: 'ingest_job' })
@Check(
  `"status" IN ('uploaded','processing','queued','initiated','complete','failed')`,
)
export class IngestJobEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string | null;

  @Column({ type: 'text', nullable: true, name: 'filename' })
  filename: string | null;

  @Column({ type: 'text', nullable: true, name: 'file_type' })
  fileType: string | null;

  @Column({ type: 'text', nullable: true, name: 'file_version_id' })
  fileVersionId: string | null;

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
