import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { IngestJobEntity } from './ingest-job.entity';
import { BaseEntity } from './base.entity';
import { DataSchemaEntity } from './data-schema.entity';

@Entity({ name: 'processed_data' })
@Index('idx_processed_data_tenant_data_name', ['tenantId', 'dataName'])
@Index('idx_processed_data_unique_key', [
  'tenantId',
  'dataName',
  'uniqueKeyValue',
])
@Index('idx_processed_data_content_hash', ['contentHash'])
export class ProcessedDataEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'text', name: 'data_name', nullable: false })
  dataName: string;

  @Column({ type: 'uuid', name: 'schema_id', nullable: true })
  schemaId: string | null;

  @ManyToOne(() => DataSchemaEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'schema_id' })
  schema: DataSchemaEntity;

  @Column({ type: 'text', name: 'content_hash', nullable: true })
  contentHash: string;

  @Column({ type: 'text', name: 'unique_key_value', nullable: false })
  uniqueKeyValue: string;

  @Column({ type: 'jsonb', name: 'data', nullable: false })
  data: Record<string, any>;

  @Column({ type: 'uuid', name: 'ingest_job_id', nullable: true })
  ingestJobId: string | null;

  @ManyToOne(() => IngestJobEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ingest_job_id' })
  ingestJob: IngestJobEntity;
}
