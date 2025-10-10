import { Injectable, Logger } from '@nestjs/common';
import {
  IngestJobEntity,
  IngestJobService,
  ProcessedDataService,
} from '@data-ingestion/shared';
import { BaseDataService } from './base-data.service';
import { S3Service } from '../s3.service';
import { SchemaValidationService } from '../schema-validation.service';
import { parse } from 'csv-parse';

@Injectable()
export class CSVDataService extends BaseDataService {
  protected readonly logger = new Logger(CSVDataService.name);

  constructor(
    protected readonly ingestJobService: IngestJobService,
    protected readonly s3Service: S3Service,
    protected readonly schemaValidationService: SchemaValidationService,
    protected readonly processedDataService: ProcessedDataService,
  ) {
    super();
  }

  async processFile(ingestJob: IngestJobEntity) {
    const { filePath, schemaId } = ingestJob;
    this.logger.log(`Processing CSV file for ingest job: ${ingestJob.id}`);

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
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    const buffer: any[] = [];

    this.logger.log(`Starting streaming CSV parse`);

    try {
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
        cast: true,
        cast_date: false,
        skip_records_with_empty_values: false,
        bom: true,
      });

      parser.on('readable', async () => {
        let record;
        while ((record = parser.read()) !== null) {
          totalRows++;

          if (!this.schemaValidationService.validate(record)) {
            this.logger.warn(
              `Invalid CSV record at row ${totalRows}: ${JSON.stringify(
                this.schemaValidationService.getErrors(),
              )}`,
            );
            invalidRows++;
            continue;
          }

          validRows++;
          buffer.push(record);

          if (buffer.length >= batchSize) {
            const batchToSave = [...buffer];
            buffer.length = 0;

            await this.saveBatch(batchToSave, ingestJob, uniqueField);
            this.logger.debug(`Processed batch: ${batchToSave.length} rows`);
          }
        }
      });

      fileStream.pipe(parser);

      await new Promise<void>((resolve, reject) => {
        parser.on('end', resolve);
        parser.on('error', reject);
      });

      if (buffer.length > 0) {
        await this.saveBatch(buffer, ingestJob, uniqueField);
        this.logger.log(`Processed final batch: ${buffer.length} rows`);
      }

      this.logger.log(`Finished processing CSV file`);
      this.logger.log(`Total rows: ${totalRows}`);

      this.completeJob(ingestJob);
    } catch (err) {
      this.logger.error(
        `Failed to process CSV file: ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
      this.failJob(ingestJob);
    }
  }
}
