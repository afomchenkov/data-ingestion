import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedDataEntity } from '../entities';

@Injectable()
export class ProcessedDataService {
  constructor(
    @InjectRepository(ProcessedDataEntity)
    private readonly processedDataRepository: Repository<ProcessedDataEntity>
  ) {}

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
}
