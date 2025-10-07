import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProcessedDataEntity } from './processed-data.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'processed_data_content' })
export class ProcessedDataContentEntity extends BaseEntity {
  @Column({ type: 'jsonb', name: 'payload' })
  payload: Record<string, any>;

  @Column({ type: 'uuid', name: 'data_record_id', nullable: true })
  dataRecordId: string | null;

  @ManyToOne(() => ProcessedDataEntity, (data) => data.contents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'data_record_id' })
  dataRecord: ProcessedDataEntity;
}
