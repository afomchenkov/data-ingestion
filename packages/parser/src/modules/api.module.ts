import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
// import { TypeOrmModule } from '@nestjs/typeorm';
import {
  HealthService,
  HealthController,
  PingIndicatorService,
} from './health';
import {
  FileParserController,
  KafkaConsumerController,
} from './file-parser/controllers';
import { FileParserService } from './file-parser/services';

@Module({
  imports: [
    TerminusModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    // DBModule,
    // TypeOrmModule.forRootAsync({
    //   imports: [DBModule],
    //   inject: [DbSettingsService],
    //   useFactory: (settingService: DbSettingsService) => {
    //     return settingService.typeOrmUseFactory;
    //   },
    // }),
  ],
  controllers: [
    HealthController,
    FileParserController,
    KafkaConsumerController,
  ],
  providers: [HealthService, PingIndicatorService, FileParserService],
})
export class ApiModule {}
