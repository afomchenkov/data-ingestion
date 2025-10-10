import { Injectable, Logger } from '@nestjs/common';
import { IngestJobEntity, IngestJobService } from '@data-ingestion/shared';
import { BaseDataService } from './base-data.service';

@Injectable()
export class CSVDataService extends BaseDataService {
  protected readonly logger = new Logger(CSVDataService.name);

  constructor(protected readonly ingestJobService: IngestJobService) {
    super();
  }

  async processFile(ingestJob: IngestJobEntity) {
    this.logger.log(`Processing CSV file for ingest job: ${ingestJob.id}`);
  }

  async validateRawData() {
    this.logger.log(`Validating CSV file for ingest job`);
  }
}
