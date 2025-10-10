import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'data_schema' })
export class DataSchemaEntity extends BaseEntity {
  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'tenant_id' })
  tenantId?: string;

  @Column({ type: 'jsonb', nullable: false })
  schema: Record<string, any>;

  @Column({
    type: 'text',
    nullable: false,
  })
  file_type: 'csv' | 'ndjson' | 'json';

  @Column({ type: 'text', default: ',' })
  delimiter: string;
}
