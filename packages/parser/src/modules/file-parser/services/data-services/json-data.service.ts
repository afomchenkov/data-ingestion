import { Injectable, Logger } from '@nestjs/common';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import Batch from 'stream-json/utils/Batch';
import {
  IngestJobEntity,
  IngestJobService,
  ProcessedDataService,
} from '@data-ingestion/shared';
import { BaseDataService } from './base-data.service';
import { SchemaValidationService } from '../schema-validation.service';
import { S3Service } from '../s3.service';

@Injectable()
export class JSONDataService extends BaseDataService {
  protected readonly logger = new Logger(JSONDataService.name);

  constructor(
    protected readonly ingestJobService: IngestJobService,
    protected readonly s3Service: S3Service,
    protected readonly schemaValidationService: SchemaValidationService,
    protected readonly processedDataService: ProcessedDataService,
  ) {
    super();
  }

  /**
   * Process a JSON file
   * - validates the file data against assigned schema, if the record does not match the schema, it is skipped
   * - saves the record to the database in batches of 1000
   * 
   * @param ingestJob 
   * @returns 
   */
  async processFile(ingestJob: IngestJobEntity) {
    const { filePath, schemaId } = ingestJob;
    this.logger.log(`Processing JSON file for ingest job: ${ingestJob.id}`);

    if (!filePath) {
      this.logger.error('File path is required');
      this.failJob(ingestJob);
      return;
    }

    if (!schemaId) {
      this.logger.error('Schema ID is required');
      this.failJob(ingestJob);
      return;
    }

    const { uniqueField } =
      await this.schemaValidationService.loadSchema(schemaId);
    const fileStream = await this.s3Service.getFileStream(filePath);

    const batchSize = 1000;
    let totalItems = 0;
    let validItems = 0;
    let invalidItems = 0;

    this.logger.log(`Starting streaming JSON parse`);

    try {
      const pipeline = chain([
        fileStream,
        parser(),
        streamArray(),
        new Batch({ batchSize }),
      ]);

      for await (const batch of pipeline) {
        const items = batch as any[];
        const validatedItems: any[] = [];

        for (const item of items) {
          const value = item.value || item;

          if (!this.schemaValidationService.validate(value)) {
            this.logger.error(
              `Invalid JSON record at index ${totalItems}: ${JSON.stringify(
                this.schemaValidationService.getErrors(),
              )}`,
            );
            invalidItems++;
            continue;
          }

          validatedItems.push(value);
          validItems++;
        }

        totalItems += items.length;

        if (validatedItems.length > 0) {
          await this.saveBatch(validatedItems, ingestJob, uniqueField);
          this.logger.debug(`Processed batch: ${validatedItems.length} items`);
        }

        if (totalItems % 10000 === 0) {
          this.logger.log(`Progress: ${totalItems} items processed`);
        }
      }

      this.logger.log(`Finished processing JSON array`);
      this.logger.log(`Total items: ${totalItems}`);

      this.completeJob(ingestJob);
    } catch (err) {
      this.logger.error(
        `Failed to process JSON file: ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
      this.failJob(ingestJob);
    }
  }
}
