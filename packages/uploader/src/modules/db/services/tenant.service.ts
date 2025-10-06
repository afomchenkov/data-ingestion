import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../entities';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async findAll(): Promise<TenantEntity[]> {
    return this.tenantRepository.find();
  }

  async findOne(id: string): Promise<TenantEntity | null> {
    return this.tenantRepository.findOneBy({ id });
  }

  async remove(id: string): Promise<void> {
    await this.tenantRepository.delete(id);
  }

  async create(tenant: Partial<TenantEntity>): Promise<TenantEntity> {
    return this.tenantRepository.save(tenant);
  }
}
