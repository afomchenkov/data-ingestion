import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngestJobEntity } from '../entities';

@Injectable()
export class IngestJobService {
  constructor(
    @InjectRepository(IngestJobEntity)
    private readonly ingestJobRepository: Repository<IngestJobEntity>,
  ) {}

  async findAll(): Promise<IngestJobEntity[]> {
    return this.ingestJobRepository.find();
  }

  async findOne(id: string): Promise<IngestJobEntity | null> {
    return this.ingestJobRepository.findOneBy({ id });
  }

  async create(data: Partial<IngestJobEntity>): Promise<IngestJobEntity> {
    const job = this.ingestJobRepository.create(data);
    return this.ingestJobRepository.save(job);
  }

  async update(id: string, data: Partial<IngestJobEntity>): Promise<IngestJobEntity | null> {
    await this.ingestJobRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.ingestJobRepository.delete(id);
  }
}
