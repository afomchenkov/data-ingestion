import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbSettingsService } from './db-settings.service';
import { TenantEntity } from './entities';
import { TenantService } from './services';

const entities = [
  TenantEntity
];

const services = [
  DbSettingsService,
  TenantService,
]

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [...services],
  exports: [...services],
})
export class DBModule { }
