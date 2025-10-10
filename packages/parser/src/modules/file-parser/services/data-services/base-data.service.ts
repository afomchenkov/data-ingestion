import { Logger } from '@nestjs/common';
import {
  IngestJobEntity,
  IngestJobStatus,
  IngestJobService,
} from '@data-ingestion/shared';

export abstract class BaseDataService {
  protected abstract readonly logger: Logger;
  protected abstract readonly ingestJobService: IngestJobService;

  // abstract validateRawData(): Promise<void>;

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
}
