import { Injectable, Logger } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { IngestJobStatus } from '@data-ingestion/shared';
import {
  NewFileUploadSuccessEvent,
  FileNotFoundErrorEvent,
  DuplicateUploadErrorEvent,
  FileTypeErrorEvent,
  SQSErrorEvent,
  IngestJobNotFoundErrorEvent,
  IngestJobService,
} from '@data-ingestion/shared';
import {
  CSVDataService,
  JSONDataService,
  NDJSONDataService,
} from './data-services';

export type KafkaSuccessMessage = NewFileUploadSuccessEvent;
export type KafkaErrorMessage =
  | FileNotFoundErrorEvent
  | DuplicateUploadErrorEvent
  | FileTypeErrorEvent
  | SQSErrorEvent
  | IngestJobNotFoundErrorEvent;

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly ingestJobService: IngestJobService,
    private readonly csvDataService: CSVDataService,
    private readonly jsonDataService: JSONDataService,
    private readonly ndjsonDataService: NDJSONDataService,
  ) {}

  async handleSuccess(message: KafkaSuccessMessage, _context: KafkaContext) {
    const { jobId } = message.payload || {};

    this.logger.log(`Kafka message received for jobId: ${jobId}`);

    const ingestJob = await this.ingestJobService.findOne(jobId || '');
    if (!ingestJob) {
      this.logger.error(`Ingest job not found for uploadId: ${jobId}`);
      // TODO: handle job not found error
      return;
    }

    ingestJob.status = IngestJobStatus.PROCESSING;
    await this.ingestJobService.update(ingestJob.id, ingestJob);

    this.logger.log(`Ingest job found: ${JSON.stringify(ingestJob)}`);

    // we can guarantee here:
    // - the uploaded file is valid
    // - matches declared upload type
    // - the file is not a duplicate (checked by sha256 hash)
    switch (ingestJob.fileType) {
      case 'ndjson':
        await this.ndjsonDataService.processFile(ingestJob);
        break;
      case 'json':
        await this.jsonDataService.processFile(ingestJob);
        break;
      case 'csv':
        await this.csvDataService.processFile(ingestJob);
        break;
      default:
        this.logger.error(`Unsupported file type: ${ingestJob.fileType}`);
        break;
    }
  }

  async handleError(message: KafkaErrorMessage, _context: KafkaContext) {
    this.logger.error(message);

    // TODO: handle ingestion Kafka errors
  }
}
