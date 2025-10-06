import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaProducerService } from './kafka-producer.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.getOrThrow<string>('KAFKA_CLIENT_ID'),
              brokers: [configService.getOrThrow<string>('KAFKA_BROKER_URL')],
            },
            consumer: {
              groupId: configService.getOrThrow<string>('KAFKA_CONSUMER_GROUP'),
            },
          },
        }),
      },
    ]),
  ],
  providers: [KafkaProducerService],
  exports: [ClientsModule, KafkaProducerService],
})
export class KafkaModule {}
