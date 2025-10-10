import { Controller, Logger } from '@nestjs/common';
import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from '@nestjs/microservices';
import { IngestService } from '../services';
import { KafkaSuccessMessage, KafkaErrorMessage } from '../services';

@Controller()
export class KafkaConsumerController {
  private readonly logger = new Logger(KafkaConsumerController.name);

  constructor(private readonly ingestService: IngestService) {}

  @EventPattern('data_ingestion')
  handleSuccess(
    @Payload() message: KafkaSuccessMessage,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Kafka success message received`);
    this.logger.log(`Message: ${JSON.stringify(message)}`);

    this.ingestService.handleSuccess(message, context);
  }

  @EventPattern('data_ingestion_error')
  handleError(
    @Payload() message: KafkaErrorMessage,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Kafka error message received`);
    this.logger.log(`Message: ${JSON.stringify(message)}`);

    this.ingestService.handleError(message, context);
  }
}
