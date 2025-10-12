import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import {
  IngestJobStatus,
  IngestJobService,
  NewFileUploadSuccessEvent,
  FileNotFoundErrorEvent,
  DuplicateUploadErrorEvent,
  FileTypeErrorEvent,
  SQSErrorEvent,
  IngestJobNotFoundErrorEvent,
} from '@data-ingestion/shared';
import { KafkaProducerService } from '../../kafka';
import { streamToBuffer } from '@data-ingestion/shared';

@Injectable()
export class SqsFileUploadService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsFileUploadService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private polling = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly ingestJobService: IngestJobService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    const endpoint = this.configService.getOrThrow('AWS_SQS_URL');
    const ingestQueue = this.configService.getOrThrow('AWS_SQS_INGEST_QUEUE');

    this.sqsClient = new SQSClient({
      region: this.configService.getOrThrow('AWS_REGION'),
      endpoint,
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.queueUrl = `${endpoint}/000000000000/${ingestQueue}`;
  }

  async onModuleInit() {
    this.logger.log('Start SQS polling');
    this.logger.log(`SQS queue URL: ${this.queueUrl}`);
    this.startPolling();
  }

  async onModuleDestroy() {
    this.logger.log('Stop SQS polling');
    this.polling = false;
  }

  private async startPolling() {
    if (this.polling) {
      return;
    }
    this.polling = true;
    this.logger.log('Starting SQS polling...');

    while (this.polling) {
      try {
        const { Messages } = await this.sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            WaitTimeSeconds: 10,
            MaxNumberOfMessages: 5,
          }),
        );

        if (Messages) {
          for (const message of Messages) {
            await this.handleMessage(message);
            // TODO: handle message failure, retry or register to ingest error table
            // delete message after processing
            await this.sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle!,
              }),
            );
          }
        }
      } catch (err) {
        this.logger.error(`SQS polling error: ${err}`);
        // wait for 2 seconds before retrying
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  /**
   * Handle a message from the SQS queue upon file upload completion
   * - checks if the file exists in S3, otherwise publishes an error event - FileNotFoundErrorEvent
   * - checks if the ingest job exists, otherwise publishes an error event - IngestJobNotFoundErrorEvent
   * - checks if the file is valid and matches declared upload type, otherwise publishes an error event - FileTypeErrorEvent
   * - checks by file content sha256 whether the file is already ingested, otherwise publishes an error event - DuplicateUploadErrorEvent
   * - publishes a success event and sets the ingest job status to QUEUED - NewFileUploadSuccessEvent
   *
   * @param message - The message to handle
   * @returns
   */
  private async handleMessage(message: Message) {
    try {
      if (!message.Body || !message.ReceiptHandle) {
        this.logger.error('Message body is empty');
        return;
      }

      const body = JSON.parse(message.Body);
      const payload = body.Records ? body : JSON.parse(body.Message);
      const record = payload.Records[0];
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      const fileHead = await this.s3Service.checkIfFileExists(key);
      if (!fileHead) {
        const errorMessage = `File not found: ${key}`;
        this.logger.error(errorMessage);

        await this.kafkaProducer.publishError(
          new FileNotFoundErrorEvent({
            reason: errorMessage,
            key,
          }),
        );

        return;
      }

      const metadata = fileHead.Metadata || {};
      this.logger.log(`Metadata: ${JSON.stringify(metadata)}`);

      const { uploadid, tenantid } = metadata;
      const ingestJob = await this.ingestJobService.findOneByUpload(
        uploadid,
        tenantid,
      );

      if (!ingestJob) {
        const errorMessage = `Ingest job not found: [uploadId: ${uploadid}, tenantId: ${tenantid}]`;
        this.logger.error(errorMessage);

        await this.kafkaProducer.publishError(
          new IngestJobNotFoundErrorEvent({
            uploadid,
            tenantid,
            reason: errorMessage,
          }),
        );

        return;
      }

      this.logger.log(`Ingest job found: ${JSON.stringify(ingestJob)}`);

      if (ingestJob.status !== IngestJobStatus.INITIATED) {
        this.logger.error(
          `The file has already been uploaded, not possible to process again the same signed URL: [uploadId: ${uploadid}, tenantId: ${tenantid}]`,
        );

        // remove duplicate file version from S3
        // TODO: handle files multi versioning
        await this.s3Service.deleteFileVersion(key, record.s3.object.versionId);
        return;
      }

      // check here that the file is valid and matches declared upload type
      // to guarantee the file type consistency and avoid potential data corruption
      const isInvalidFileType = await this.s3Service.validateFileType(
        key,
        (ingestJob.fileType as 'csv' | 'json' | 'ndjson') || 'unknown',
      );

      // check whether the file is valid and matches declared upload type
      if (isInvalidFileType) {
        ingestJob.status = IngestJobStatus.FAILED;
        await this.ingestJobService.update(ingestJob.id, ingestJob);
        const errorMessage = `The file is invalid or does not match declared upload type: [uploadId: ${uploadid}, tenantId: ${tenantid}]`;
        this.logger.error(errorMessage);

        await this.kafkaProducer.publishError(
          new FileTypeErrorEvent({
            reason: errorMessage,
            uploadid,
            tenantid,
          }),
        );

        return;
      }

      ingestJob.status = IngestJobStatus.UPLOADED;
      ingestJob.sizeBytes = record.s3.object.size;
      await this.ingestJobService.update(ingestJob.id, ingestJob);

      const fileBuffer = await streamToBuffer(
        await this.s3Service.getFileStream(key),
      );
      const contentSha256 = createHash('sha256')
        .update(fileBuffer)
        .digest('hex');
      ingestJob.contentSha256 = contentSha256;

      // check by content sha256 whether the file is already ingested
      const existingIngestJob =
        await this.ingestJobService.findOneByContentSha256(contentSha256);
      if (existingIngestJob) {
        this.logger.error(`It looks like a duplicate file: ${contentSha256}`);
        this.logger.error(
          `Existing ingest job: ${JSON.stringify(existingIngestJob)}`,
        );
        this.logger.error(`File key: ${existingIngestJob.filePath}`);

        await this.kafkaProducer.publishError(
          new DuplicateUploadErrorEvent({
            reason: 'Duplicate file upload by SHA256',
            contentSha256,
            newFileKey: key,
            existingFileKey: existingIngestJob.filePath,
          }),
        );

        // mark ingest job as duplicate, leave the file in S3 and ingest job in DB
        ingestJob.status = IngestJobStatus.DUPLICATE;
        await this.ingestJobService.update(ingestJob.id, ingestJob);

        return;
      }

      const { id: jobId, uploadId, tenantId } = ingestJob;
      await this.kafkaProducer.publishSuccess(
        new NewFileUploadSuccessEvent({
          jobId,
          uploadId,
          tenantId,
        }),
      );
      this.logger.log(`Kafka message published for uploadId: ${uploadId}`);

      // set appropriate status and after sending Kafka message
      ingestJob.status = IngestJobStatus.QUEUED;
      await this.ingestJobService.update(ingestJob.id, ingestJob);

      this.logger.log(`========================================`);
      this.logger.log(`The file is valid and match declared upload type`);
      this.logger.log(`File Body: ${JSON.stringify(body)}`);
      this.logger.log(`File uploaded: s3://${bucket}/${key}`);
      this.logger.log(`========================================`);
    } catch (error) {
      const errorMessage = `Error handling SQS message: ${error}`;

      await this.kafkaProducer.publishError(
        new SQSErrorEvent({
          reason: 'SQS handle message error',
          error: errorMessage || 'Unknown error',
        }),
      );

      this.logger.error(
        `Kafka error message published: ${JSON.stringify(errorMessage)}`,
      );
    }
  }
}
