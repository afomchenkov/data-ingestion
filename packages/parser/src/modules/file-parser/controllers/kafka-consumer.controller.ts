import { Controller, Logger } from '@nestjs/common';
import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from '@nestjs/microservices';

@Controller()
export class KafkaConsumerController {
  private readonly logger = new Logger(KafkaConsumerController.name);

  @EventPattern('data_ingestion')
  handleSuccess(@Payload() message: any, @Ctx() context: KafkaContext) {
    this.logger.log(`Kafka success message received`);

    this.logger.log(`Raw: ${JSON.stringify(message)}`);
    if (context && context.getMessage()) {
      this.logger.log(`Value: ${context.getMessage().value?.toString()}`);
    }
  }

  @EventPattern('data_ingestion_error')
  handleError(@Payload() message: any, @Ctx() context: KafkaContext) {
    this.logger.log(`Kafka error message received`);
    
    this.logger.log(`Raw: ${JSON.stringify(message)}`);
    if (context && context.getMessage()) {
      this.logger.log(`Value: ${context.getMessage().value?.toString()}`);
    }
  }
}
