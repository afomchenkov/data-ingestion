import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { IngestJobEntity } from './ingest-job.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'processed_data' })
export class ProcessedDataEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'text', nullable: true, name: 'data_name' })
  dataName: string;

  @Column({ type: 'uuid', name: 'schema_id', nullable: true })
  schemaId: string | null;

  @Column({ type: 'text', name: 'content_hash' })
  contentHash: string;

  @Column({ type: 'jsonb', name: 'data' })
  data: Record<string, any>;

  @Column({ type: 'uuid', name: 'ingest_job_id', nullable: true })
  ingestJobId: string | null;

  @ManyToOne(() => IngestJobEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ingest_job_id' })
  ingestJob: IngestJobEntity;
}
