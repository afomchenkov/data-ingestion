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
} from '@aws-sdk/client-sqs';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { S3Service, DeclaredFileType } from './s3.service';
import { IngestJobStatus } from '../../db/entities';
import { IngestJobService } from '../../db/services';
import { KafkaProducerService } from '../../kafka';
import { streamToBuffer } from '../utils';

@Injectable()
export class SqsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private polling = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly ingestJobService: IngestJobService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    const endpoint = this.configService.getOrThrow('AWS_LOCALSTACK_URL');
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

  private async handleMessage(message: any) {
    try {
      if (!message.Body) {
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

        const msg = {
          id: Date.now(),
          status: 'error',
          reason: errorMessage,
          payload: { data: { key } },
        };
        await this.kafkaProducer.publishError(msg);

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
        this.logger.error(
          `Ingest job not found: [uploadId: ${uploadid}, tenantId: ${tenantid}]`,
        );

        const msg = {
          id: Date.now(),
          status: 'error',
          reason: 'Ingest job not found',
          payload: { data: { uploadid, tenantid } },
        };
        await this.kafkaProducer.publishError(msg);

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

      // mark ingest job as processing
      ingestJob.status = IngestJobStatus.PROCESSING;
      await this.ingestJobService.update(ingestJob.id, ingestJob);
      const fileType = ingestJob.fileType as DeclaredFileType;
      const isValidFileType = await this.s3Service.isValidateFileType(
        key,
        fileType,
      );

      // check whether the file is valid and matches declared upload type
      if (!isValidFileType) {
        ingestJob.status = IngestJobStatus.FAILED;
        await this.ingestJobService.update(ingestJob.id, ingestJob);
        this.logger.error(
          `The file is invalid or does not match declared upload type: [uploadId: ${uploadid}, tenantId: ${tenantid}]`,
        );

        const msg = {
          id: Date.now(),
          status: 'error',
          reason: 'The file is invalid or does not match declared upload type',
          payload: { data: { uploadid, tenantid } },
        };
        await this.kafkaProducer.publishError(msg);

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

        const msg = {
          id: Date.now(),
          status: 'error',
          reason: 'Duplicate file upload',
          payload: {
            data: {
              contentSha256,
              newFile: key,
              existingFile: existingIngestJob.filePath,
            },
          },
        };
        await this.kafkaProducer.publishError(msg);

        // mark ingest job as duplicate, leave the file in S3 and ingest job in DB
        ingestJob.status = IngestJobStatus.DUPLICATE;
        await this.ingestJobService.update(ingestJob.id, ingestJob);

        return;
      }

      const msg = {
        id: Date.now(),
        status: 'success',
        payload: {
          data: {
            jobId: ingestJob.id,
            uploadId: ingestJob.uploadId,
            tenantId: ingestJob.tenantId,
          },
        },
      };
      await this.kafkaProducer.publishSuccess(msg);
      this.logger.log(`Kafka message published: ${JSON.stringify(msg)}`);

      // set appropriate status and after sending Kafka message
      ingestJob.status = IngestJobStatus.QUEUED;
      await this.ingestJobService.update(ingestJob.id, ingestJob);

      this.logger.log(`========================================`);
      this.logger.log(`The file is valid and match declared upload type`);
      this.logger.log(`File Body: ${JSON.stringify(body)}`);
      this.logger.log(`File uploaded: s3://${bucket}/${key}`);
      this.logger.log(`========================================`);
    } catch (error) {
      this.logger.error(`Error handling SQS message: ${error}`);

      const msg = {
        id: Date.now(),
        status: 'error',
        reason: 'SQS handle message error',
        payload: {
          data: {
            error,
          },
        },
      };
      await this.kafkaProducer.publishError(msg);
      this.logger.error(`Kafka error message published: ${JSON.stringify(msg)}`);
    }
  }
}
