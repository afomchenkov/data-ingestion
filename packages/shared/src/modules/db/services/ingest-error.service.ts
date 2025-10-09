import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngestErrorEntity } from '../entities';

@Injectable()
export class IngestErrorService {
  constructor(
    @InjectRepository(IngestErrorEntity)
    private readonly ingestErrorRepository: Repository<IngestErrorEntity>,
  ) {}

  async findAll(): Promise<IngestErrorEntity[]> {
    return this.ingestErrorRepository.find({
      relations: ['ingestJob', 'tenant'],
    });
  }

  async findOne(id: string): Promise<IngestErrorEntity | null> {
    return this.ingestErrorRepository.findOne({
      where: { id },
      relations: ['ingestJob', 'tenant'],
    });
  }

  async create(data: Partial<IngestErrorEntity>): Promise<IngestErrorEntity> {
    const error = this.ingestErrorRepository.create(data);
    return this.ingestErrorRepository.save(error);
  }

  async update(id: string, data: Partial<IngestErrorEntity>): Promise<IngestErrorEntity | null> {
    await this.ingestErrorRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.ingestErrorRepository.delete(id);
  }

  async findByJobId(ingestJobId: string): Promise<IngestErrorEntity[]> {
    return this.ingestErrorRepository.find({
      where: { ingestJobId },
      relations: ['ingestJob', 'tenant'],
    });
  }

  async findByTenantId(tenantId: string): Promise<IngestErrorEntity[]> {
    return this.ingestErrorRepository.find({
      where: { tenantId },
      relations: ['ingestJob', 'tenant'],
    });
  }
}
