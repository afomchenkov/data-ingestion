import { Injectable, Logger } from '@nestjs/common';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private polling = false;

  constructor(private readonly configService: ConfigService) {
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
    this.logger.log(`SQS queue URL: ${this.queueUrl}`);

    this.startPolling();
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
      const body = JSON.parse(message.Body);
      const payload = body.Records ? body : JSON.parse(body.Message);
      const record = payload.Records[0];
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // do file validation, check if valid CSV/JSON/Parquet and fire Kafka message to parser service

      this.logger.log(`File Body: ${JSON.stringify(body)}`);
      this.logger.log(`File Record: ${JSON.stringify(record)}`);
      this.logger.log(`File uploaded: s3://${bucket}/${key}`);
    } catch (error) {
      this.logger.error(`Error handling SQS message: ${error}`);
    }
  }
}
