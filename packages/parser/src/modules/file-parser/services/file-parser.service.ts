import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ProcessedDataService,
  ProcessedDataEntity,
} from '@data-ingestion/shared';
import {
  FetchDataRecordsDto,
  FetchFilteredFieldsDto,
  ProcessedDataResponseDto,
  FilteredDataResponseDto,
  PaginatedResponseDto,
} from '../dto';

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);

  constructor(private readonly processedDataService: ProcessedDataService) {}

  async fetchDataRecords(
    query: FetchDataRecordsDto,
  ): Promise<PaginatedResponseDto<ProcessedDataResponseDto>> {
    const {
      dataName,
      tenantId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    this.logger.log(
      `Fetching data records for dataName: ${dataName}, page: ${page}, limit: ${limit}`,
    );

    try {
      const qb = this.processedDataService.createQueryBuilder();

      qb.where('pd.dataName = :dataName', { dataName });

      if (tenantId) {
        qb.andWhere('pd.tenantId = :tenantId', { tenantId });
      }

      const total = await qb.getCount();

      const offset = (page - 1) * limit;
      const records = await qb
        .orderBy(`pd.${sortBy}`, sortOrder)
        .skip(offset)
        .take(limit)
        .getMany();

      this.logger.log(
        `Found ${total} total records, returning page ${page} with ${records.length} items`,
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: records.map(this.mapToResponseDto),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching data records: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async fetchFilteredFields(
    body: FetchFilteredFieldsDto,
  ): Promise<PaginatedResponseDto<FilteredDataResponseDto>> {
    const { dataName, fields, tenantId, page = 1, limit = 20 } = body;

    this.logger.log(
      `Fetching filtered fields for dataName: ${dataName}, fields: [${fields.join(', ')}], page: ${page}, limit: ${limit}`,
    );

    try {
      const qb = this.processedDataService.createQueryBuilder();

      qb.select(['pd.id', 'pd.uniqueKeyValue', 'pd.data']).where(
        'pd.dataName = :dataName',
        { dataName },
      );

      if (tenantId) {
        qb.andWhere('pd.tenantId = :tenantId', { tenantId });
      }

      const total = await qb.getCount();

      const offset = (page - 1) * limit;
      const records = await qb.skip(offset).take(limit).getMany();

      this.logger.log(
        `Found ${total} total records, filtering ${fields.length} fields from ${records.length} items`,
      );

      // Extract only the requested fields from JSONB data
      const filteredData = records.map((record) => ({
        id: record.id,
        uniqueKeyValue: record.uniqueKeyValue,
        data: this.extractFields(record.data, fields),
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        data: filteredData,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching filtered fields: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private extractFields(
    data: Record<string, any>,
    fieldPaths: string[],
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const path of fieldPaths) {
      const value = this.getNestedValue(data, path);
      if (value !== undefined) {
        this.setNestedValue(result, path, value);
      }
    }

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  private mapToResponseDto(
    entity: ProcessedDataEntity,
  ): ProcessedDataResponseDto {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      dataName: entity.dataName,
      schemaId: entity.schemaId,
      contentHash: entity.contentHash,
      uniqueKeyValue: entity.uniqueKeyValue,
      data: entity.data,
      ingestJobId: entity.ingestJobId,
    };
  }
}
