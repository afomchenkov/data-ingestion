import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbSettingsService } from './db-settings.service';
import {
  TenantEntity,
  IngestJobEntity,
  IngestErrorEntity,
  ProcessedDataEntity,
  DataSchemaEntity,
} from './entities';
import {
  RawQueryService,
  TenantService,
  IngestJobService,
  IngestErrorService,
  ProcessedDataService,
  DataSchemaService,
} from './services';

const entities = [
  TenantEntity,
  IngestJobEntity,
  IngestErrorEntity,
  ProcessedDataEntity,
  DataSchemaEntity,
];

const services = [
  RawQueryService,
  DbSettingsService,
  TenantService,
  IngestJobService,
  IngestErrorService,
  ProcessedDataService,
  DataSchemaService,
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [...services],
  exports: [...services],
})
export class DBModule {}
