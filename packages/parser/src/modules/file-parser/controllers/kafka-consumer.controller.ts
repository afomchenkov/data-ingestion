import { Controller, Logger } from '@nestjs/common';
import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from '@nestjs/microservices';
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

@Controller()
export class KafkaConsumerController {
  private readonly logger = new Logger(KafkaConsumerController.name);

  @EventPattern('data_ingestion')
  handleSuccess(
    @Payload() message: KafkaSuccessMessage,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Kafka success message received`);

    this.logger.log(`Raw: ${JSON.stringify(message)}`);
    if (context && context.getMessage()) {
      this.logger.log(`Value: ${context.getMessage().value?.toString()}`);
    }
  }

  @EventPattern('data_ingestion_error')
  handleError(
    @Payload() message: KafkaErrorMessage,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Kafka error message received`);

    this.logger.log(`Raw: ${JSON.stringify(message)}`);
    if (context && context.getMessage()) {
      this.logger.log(`Value: ${context.getMessage().value?.toString()}`);
    }
  }
}
