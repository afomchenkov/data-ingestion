import { Injectable, Logger } from '@nestjs/common';
import { IngestJobEntity, IngestJobService } from '@data-ingestion/shared';
import { BaseDataService } from './base-data.service';

@Injectable()
export class JSONDataService extends BaseDataService {
  protected readonly logger = new Logger(JSONDataService.name);

  constructor(protected readonly ingestJobService: IngestJobService) {
    super();
  }

  async processFile(
    ingestJob: IngestJobEntity,
  ) {
    this.logger.log(`Processing JSON file for ingest job: ${ingestJob.id}`);
  }

  async validateRawData() {
    this.logger.log(`Validating JSON file for ingest job`);
  }
}
