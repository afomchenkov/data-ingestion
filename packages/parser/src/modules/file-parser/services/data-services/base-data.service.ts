import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as ndjson from 'ndjson';
import { default as csvParser } from 'csv-parser';
import { parser as jsonParser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import {
  IngestJobEntity,
  IngestJobStatus,
  IngestJobService,
  ProcessedDataEntity,
  ProcessedDataService,
} from '@data-ingestion/shared';
export abstract class BaseDataService {
  protected abstract readonly logger: Logger;
  protected abstract readonly ingestJobService: IngestJobService;
  protected abstract readonly processedDataService: ProcessedDataService;

  abstract processFile(
    ingestJob: IngestJobEntity,
    opts?: {
      idempotencyKey?: string;
      conflictPolicy?: string;
    },
  ): Promise<void>;

  async completeJob(ingestJob: IngestJobEntity): Promise<void> {
    this.logger.log(`Completing ingest job: ${ingestJob.id}`);

    ingestJob.status = IngestJobStatus.COMPLETE;
    await this.ingestJobService.update(ingestJob.id, ingestJob);
  }

  async failJob(ingestJob: IngestJobEntity): Promise<void> {
    this.logger.log(`Failing ingest job: ${ingestJob.id}`);

    ingestJob.status = IngestJobStatus.FAILED;
    await this.ingestJobService.update(ingestJob.id, ingestJob);
  }

  protected generateHash(data: Record<string, any>): string {
    const content = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  protected createEntity(
    data: Record<string, any>,
    ingestJob: IngestJobEntity,
    uniqueField: string,
  ): ProcessedDataEntity {
    const entity = new ProcessedDataEntity();

    entity.tenantId = ingestJob.tenantId;
    entity.schemaId = ingestJob.schemaId;
    entity.ingestJobId = ingestJob.id;
    entity.data = data;
    entity.uniqueKeyValue = data[uniqueField] || 'unknown';
    entity.dataName = ingestJob.dataName || 'unknown';
    entity.contentHash = this.generateHash(data);

    return entity;
  }

  protected async saveBatch(
    records: any[],
    ingestJob: IngestJobEntity,
    uniqueField: string,
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }

    this.logger.log(`Inserting batch of: ${records.length} rows`);

    await this.processedDataService.bulkUpsert(
      records.map((record) =>
        this.createEntity(record, ingestJob, uniqueField),
      ),
    );

    this.logger.log(`Inserted batch of: ${records.length} rows`);
  }

  protected getParser(format: string) {
    switch (format.toLowerCase()) {
      case 'ndjson':
        return ndjson.parse();
      case 'json':
        return jsonParser({ jsonStreaming: true }).pipe(streamArray());
      case 'csv':
        return csvParser();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
