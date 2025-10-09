import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import {
  NewFileUploadSuccessEvent,
  FileNotFoundErrorEvent,
  DuplicateUploadErrorEvent,
  FileTypeErrorEvent,
  SQSErrorEvent,
  IngestJobNotFoundErrorEvent,
} from '@data-ingestion/shared';

export type KafkaSuccessMessage = NewFileUploadSuccessEvent;
export type KafkaErrorMessage =
  | FileNotFoundErrorEvent
  | DuplicateUploadErrorEvent
  | FileTypeErrorEvent
  | SQSErrorEvent
  | IngestJobNotFoundErrorEvent;

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  private readonly successTopic: string;
  private readonly errorTopic: string;

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {
    this.successTopic = this.configService.getOrThrow(
      'KAFKA_DATA_INGEST_TOPIC_NAME',
    );
    this.errorTopic = this.configService.getOrThrow(
      'KAFKA_DATA_INGEST_ERROR_TOPIC_NAME',
    );
  }

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async publishSuccess(message: KafkaSuccessMessage) {
    try {
      return await this.kafkaClient.emit(this.successTopic, message);
    } catch (err) {
      this.logger.error('Publish failed, retrying...');
      this.logger.error(err);
      // retry after 2 seconds if leadership election is in progress
      await new Promise((res) => setTimeout(res, 2000));
      return this.kafkaClient.emit(this.successTopic, message);
    }
  }

  async publishError(message: KafkaErrorMessage) {
    try {
      return await this.kafkaClient.emit(this.errorTopic, message);
    } catch (err) {
      this.logger.error('Publish failed, retrying...');
      this.logger.error(err);
      await new Promise((res) => setTimeout(res, 2000));
      return this.kafkaClient.emit(this.errorTopic, message);
    }
  }

  async publish(topic: string, message: any) {
    return this.kafkaClient.emit(topic, message);
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }
}
