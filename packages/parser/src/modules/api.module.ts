import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBModule, DbSettingsService } from '@data-ingestion/shared';
import {
  HealthService,
  HealthController,
  PingIndicatorService,
} from './health';
import {
  FileParserController,
  KafkaConsumerController,
} from './file-parser/controllers';
import {
  IngestService,
  FileParserService,
  S3Service,
  CSVDataService,
  JSONDataService,
  NDJSONDataService,
  SchemaValidationService,
} from './file-parser/services';

@Module({
  imports: [
    TerminusModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    DBModule,
    TypeOrmModule.forRootAsync({
      imports: [DBModule],
      inject: [DbSettingsService],
      useFactory: (settingService: DbSettingsService) => {
        return settingService.typeOrmUseFactory;
      },
    }),
  ],
  controllers: [
    HealthController,
    FileParserController,
    KafkaConsumerController,
  ],
  providers: [
    HealthService,
    PingIndicatorService,
    IngestService,
    FileParserService,
    S3Service,
    CSVDataService,
    JSONDataService,
    NDJSONDataService,
    SchemaValidationService,
  ],
})
export class ApiModule {}
