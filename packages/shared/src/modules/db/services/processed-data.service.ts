import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProcessedDataEntity } from '../entities';

@Injectable()
export class ProcessedDataService {
  protected readonly logger = new Logger(ProcessedDataService.name);

  constructor(
    @InjectRepository(ProcessedDataEntity)
    private readonly processedDataRepository: Repository<ProcessedDataEntity>,
    private readonly dataSource: DataSource
  ) {}

  createQueryBuilder() {
    return this.processedDataRepository.createQueryBuilder('pd');
  }

  async findAll(): Promise<ProcessedDataEntity[]> {
    return this.processedDataRepository.find({
      relations: ['tenant', 'ingestJob'],
    });
  }

  async findOne(id: string): Promise<ProcessedDataEntity | null> {
    return this.processedDataRepository.findOne({
      where: { id },
      relations: ['tenant', 'ingestJob'],
    });
  }

  async create(
    data: Partial<ProcessedDataEntity>
  ): Promise<ProcessedDataEntity> {
    const record = this.processedDataRepository.create(data);
    return this.processedDataRepository.save(record);
  }

  async update(
    id: string,
    data: Partial<ProcessedDataEntity>
  ): Promise<ProcessedDataEntity | null> {
    await this.processedDataRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.processedDataRepository.delete(id);
  }

  async findByTenantId(tenantId: string): Promise<ProcessedDataEntity[]> {
    return this.processedDataRepository.find({
      where: { tenantId },
      relations: ['tenant', 'ingestJob'],
    });
  }

  async findByIngestJobId(ingestJobId: string): Promise<ProcessedDataEntity[]> {
    return this.processedDataRepository.find({
      where: { ingestJobId },
      relations: ['tenant', 'ingestJob'],
    });
  }

  async findByContentHash(hash: string): Promise<ProcessedDataEntity[]> {
    return this.processedDataRepository.find({
      where: { contentHash: hash },
      relations: ['tenant', 'ingestJob'],
    });
  }

  async findByDataName(dataName: string): Promise<ProcessedDataEntity[]> {
    return this.processedDataRepository.find({
      where: { dataName },
      relations: ['tenant', 'ingestJob'],
    });
  }

  async findBySchemaId(schemaId: string): Promise<ProcessedDataEntity[]> {
    return this.processedDataRepository.find({
      where: { schemaId },
      relations: ['tenant', 'ingestJob'],
    });
  }

  async bulkUpsert(records: ProcessedDataEntity[]) {
    if (!records || records.length === 0) {
      return;
    }

    const startTime = Date.now();

    try {
      // upsert with conflict resolution, this uses PostgreSQL's INSERT ... ON CONFLICT ... DO UPDATE
      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into(ProcessedDataEntity)
        .values(records)
        .orUpdate(
          ['schema_id', 'data', 'ingest_job_id', 'content_hash', 'updated_at'],
          ['tenant_id', 'data_name', 'unique_key_value'], // conflict target
          {
            skipUpdateIfNoValuesChanged: true,
          }
        )
        .execute();

      const duration = Date.now() - startTime;

      this.logger.log(
        `Bulk upserted ${records.length} records in ${duration}ms (${Math.round(
          records.length / (duration / 1000)
        )} records/sec)`
      );
    } catch (error) {
      this.logger.error(
        `Bulk upsert failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }
}
