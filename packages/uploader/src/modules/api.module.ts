import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  HealthService,
  HealthController,
  PingIndicatorService,
} from './health';
import { FileUploadModule } from './file-upload/file-upload.module';
import { DBModule } from './db/db.module';
import { DbSettingsService } from './db/db-settings.service';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    TerminusModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    FileUploadModule,
    DBModule,
    KafkaModule,
    TypeOrmModule.forRootAsync({
      imports: [DBModule],
      inject: [DbSettingsService],
      useFactory: (settingService: DbSettingsService) => {
        return settingService.typeOrmUseFactory;
      },
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService, PingIndicatorService],
})
export class ApiModule {}
