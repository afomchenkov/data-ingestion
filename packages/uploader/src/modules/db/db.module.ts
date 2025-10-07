import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbSettingsService } from './db-settings.service';
import {
  TenantEntity,
  IngestJobEntity,
  IngestErrorEntity,
  ProcessedDataEntity,
  ProcessedDataContentEntity,
} from './entities';
import {
  RawQueryService,
  TenantService,
  IngestJobService,
  IngestErrorService,
  ProcessedDataService,
  ProcessedDataContentService,
} from './services';

const entities = [
  TenantEntity,
  IngestJobEntity,
  IngestErrorEntity,
  ProcessedDataEntity,
  ProcessedDataContentEntity,
];

const services = [
  RawQueryService,
  DbSettingsService,
  TenantService,
  IngestJobService,
  IngestErrorService,
  ProcessedDataService,
  ProcessedDataContentService,
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [...services],
  exports: [...services],
})
export class DBModule {}
