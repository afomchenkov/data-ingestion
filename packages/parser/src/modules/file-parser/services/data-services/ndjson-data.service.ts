import { Injectable, Logger } from '@nestjs/common';
import { IngestJobEntity, IngestJobService } from '@data-ingestion/shared';
import { BaseDataService } from './base-data.service';
import { SchemaValidationService } from '../schema-validation.service';
import { S3Service } from '../s3.service';
import * as readline from 'readline';

@Injectable()
export class NDJSONDataService extends BaseDataService {
  protected readonly logger = new Logger(NDJSONDataService.name);

  constructor(
    protected readonly ingestJobService: IngestJobService,
    protected readonly s3Service: S3Service,
    protected readonly schemaValidationService: SchemaValidationService,
  ) {
    super();
  }

  async processFile(ingestJob: IngestJobEntity) {
    const { filePath, schemaId } = ingestJob;

    this.logger.log(`Processing NDJSON file for ingest job: ${ingestJob.id}`);

    if (!filePath) {
      throw new Error('File path is required');
    }

    if (!schemaId) {
      throw new Error('Schema ID is required');
    }

    const schema = await this.schemaValidationService.loadSchema(schemaId);
    this.logger.log(`Schema loaded: ${JSON.stringify(schema)}`);

    const fileStream = await this.s3Service.getFileStream(filePath);
    const readLineFromStream = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const buffer: any[] = [];
    const batchSize = 500;
    let totalLines = 0;

    this.logger.log(`Reading NDJSON file line by line`);
    for await (const line of readLineFromStream) {
      if (!line.trim()) {
        continue;
      }

      try {
        const obj = JSON.parse(line);
        if (!this.schemaValidationService.validate(obj)) {
          this.logger.error(
            `Invalid NDJSON record: ${JSON.stringify(this.schemaValidationService.getErrors())}`,
          );
          continue;
        }
        buffer.push(obj);

        if (buffer.length >= batchSize) {
          await this.saveBatch(buffer);
          totalLines += buffer.length;
          buffer.length = 0;
        }
      } catch (err) {
        this.logger.error(
          `Failed to parse NDJSON line: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }
    }

    if (buffer.length > 0) {
      await this.saveBatch(buffer);
      totalLines += buffer.length;
    }

    this.logger.log(`Finished reading NDJSON file line by line`);
    this.logger.log(`Total lines: ${totalLines}`);
  }

  private async saveBatch(rows: any[]): Promise<void> {
    this.logger.log(`Inserted batch of: ${rows.length} rows`);
    // if (rows.length === 0) return;
    // try {
    //   await this.dataSource
    //     .createQueryBuilder()
    //     .insert()
    //     .into('users')
    //     .values(rows)
    //     .execute();
    //   this.logger.log(`Inserted batch of ${rows.length}`);
    // } catch (err) {
    //   this.logger.error(`Error inserting batch: ${err.message}`);
    // }
    return Promise.resolve();
  }

  // async validateRawData() {
  //   this.logger.log('Validating NDJSON file for ingest job');
  // }
}
