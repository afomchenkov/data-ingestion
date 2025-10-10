import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSchemaEntity } from '../entities';

@Injectable()
export class DataSchemaService {
  constructor(
    @InjectRepository(DataSchemaEntity)
    private readonly dataSchemaRepository: Repository<DataSchemaEntity>
  ) {}

  async findAll(): Promise<DataSchemaEntity[]> {
    return this.dataSchemaRepository.find();
  }

  async findOne(id: string): Promise<DataSchemaEntity | null> {
    return this.dataSchemaRepository.findOneBy({ id });
  }

  async remove(id: string): Promise<void> {
    await this.dataSchemaRepository.delete(id);
  }

  async create(schema: Partial<DataSchemaEntity>): Promise<DataSchemaEntity> {
    return this.dataSchemaRepository.save(schema);
  }

  async update(
    id: string,
    updateData: Partial<DataSchemaEntity>
  ): Promise<DataSchemaEntity | null> {
    await this.dataSchemaRepository.update(id, updateData);
    return this.findOne(id);
  }

  async findByTenant(tenantId: string): Promise<DataSchemaEntity[]> {
    return this.dataSchemaRepository.find({ where: { tenantId } });
  }
}
