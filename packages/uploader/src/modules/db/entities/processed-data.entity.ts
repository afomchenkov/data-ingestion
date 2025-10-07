import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { IngestJobEntity } from './ingest-job.entity';
import { ProcessedDataContentEntity } from './processed-data-content.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'processed_data' })
export class ProcessedDataEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'text', nullable: true, name: 'filename' })
  filename: string | null;

  @Column({ type: 'text', nullable: true, name: 'file_type' })
  fileType: string | null;

  @Column({ type: 'text', nullable: true, name: 'file_version_id' })
  fileVersionId: string | null;

  @Column({ type: 'text', name: 'row_content_sha256' })
  rowContentSha256: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'source_timestamp' })
  sourceTimestamp: Date | null;

  @Column({ type: 'uuid', name: 'ingest_job_id', nullable: true })
  ingestJobId: string | null;

  @ManyToOne(() => IngestJobEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ingest_job_id' })
  ingestJob: IngestJobEntity;

  @Column({ type: 'bigint', default: 1, name: 'version' })
  version: string;

  @OneToMany(() => ProcessedDataContentEntity, (content) => content.dataRecord)
  contents: ProcessedDataContentEntity[];
}
