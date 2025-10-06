import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbSettingsService } from './db-settings.service';

// import {
//   ProjectEntity,
//   BoardEntity,
//   BoardColumnEntity,
//   CaseCardEntity
// } from '../entities';
// import {
//   CaseCardService,
//   BoardService,
//   BoardColumnService,
//   ProjectService,
// } from '../services';

const entities = [

];

const services = [
  DbSettingsService,
]

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forFeature(entities)],
  providers: [...services],
  exports: [...services],
})
export class DBModule { }
