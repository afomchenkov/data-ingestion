import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { ProcessedDataContentEntity } from '../entities';

export class CreateProcessedDataContentDto {
  payload: Record<string, any>;
  dataRecordId?: string;
}

export class UpdateProcessedDataContentDto {
  payload?: Record<string, any>;
  dataRecordId?: string;
}

@Injectable()
export class ProcessedDataContentService {
  constructor(
    @InjectRepository(ProcessedDataContentEntity)
    private readonly contentRepository: Repository<ProcessedDataContentEntity>,
  ) {}

  async create(
    dto: CreateProcessedDataContentDto,
  ): Promise<ProcessedDataContentEntity> {
    const content = this.contentRepository.create({
      payload: dto.payload,
      dataRecordId: dto.dataRecordId || null,
    });
    return await this.contentRepository.save(content);
  }

  async findAll(
    options?: FindManyOptions<ProcessedDataContentEntity>,
  ): Promise<ProcessedDataContentEntity[]> {
    return await this.contentRepository.find(options);
  }

  async findOne(
    id: string,
    relations?: string[],
  ): Promise<ProcessedDataContentEntity> {
    const content = await this.contentRepository.findOne({
      where: { id } as FindOptionsWhere<ProcessedDataContentEntity>,
      relations: relations || [],
    });

    if (!content) {
      throw new NotFoundException(
        `ProcessedDataContent with ID ${id} not found`,
      );
    }

    return content;
  }

  async findByDataRecordId(
    dataRecordId: string,
  ): Promise<ProcessedDataContentEntity[]> {
    return await this.contentRepository.find({
      where: { dataRecordId } as FindOptionsWhere<ProcessedDataContentEntity>,
    });
  }

  async update(
    id: string,
    dto: UpdateProcessedDataContentDto,
  ): Promise<ProcessedDataContentEntity> {
    const content = await this.findOne(id);

    if (dto.payload !== undefined) {
      content.payload = dto.payload;
    }

    if (dto.dataRecordId !== undefined) {
      content.dataRecordId = dto.dataRecordId;
    }

    return await this.contentRepository.save(content);
  }

  async remove(id: string): Promise<void> {
    const content = await this.findOne(id);
    await this.contentRepository.remove(content);
  }

  async removeByDataRecordId(dataRecordId: string): Promise<void> {
    await this.contentRepository.delete({
      dataRecordId,
    } as FindOptionsWhere<ProcessedDataContentEntity>);
  }

  async count(
    where?: FindOptionsWhere<ProcessedDataContentEntity>,
  ): Promise<number> {
    return await this.contentRepository.count({ where });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.contentRepository.count({
      where: { id } as FindOptionsWhere<ProcessedDataContentEntity>,
    });
    return count > 0;
  }

  async bulkCreate(
    dtos: CreateProcessedDataContentDto[],
  ): Promise<ProcessedDataContentEntity[]> {
    const contents = dtos.map((dto) =>
      this.contentRepository.create({
        payload: dto.payload,
        dataRecordId: dto.dataRecordId || null,
      }),
    );
    return await this.contentRepository.save(contents);
  }

  async queryByPayloadField<T = any>(
    field: string,
    value: T,
  ): Promise<ProcessedDataContentEntity[]> {
    return await this.contentRepository
      .createQueryBuilder('content')
      .where(`content.payload->>'${field}' = :value`, { value: String(value) })
      .getMany();
  }
}
