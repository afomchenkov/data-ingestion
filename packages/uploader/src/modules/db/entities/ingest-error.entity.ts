import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IngestJobEntity } from './ingest-job.entity';
import { TenantEntity } from './tenant.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'ingest_error' })
export class IngestErrorEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'ingest_job_id', nullable: true })
  ingestJobId: string | null;

  @ManyToOne(() => IngestJobEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingest_job_id' })
  ingestJob: IngestJobEntity;

  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'text', nullable: true, name: 'filename' })
  filename: string | null;

  @Column({ type: 'text', nullable: true, name: 'file_type' })
  fileType: string | null;

  @Column({ type: 'text', nullable: true, name: 'content_sha256' })
  contentSha256: string | null;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @Column({ type: 'text', nullable: true, name: 'error_status' })
  errorStatus: string | null;
}
