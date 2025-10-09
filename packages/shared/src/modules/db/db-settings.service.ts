import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export type UseFactoryResult =
  | TypeOrmModuleOptions
  | Promise<TypeOrmModuleOptions>;

@Injectable()
export class DbSettingsService {
  constructor(private readonly configService: ConfigService) { }

  get typeOrmUseFactory(): UseFactoryResult {
    return {
      type: 'postgres',
      host: this.configService.getOrThrow('POSTGRES_HOST'),
      port: this.configService.getOrThrow('POSTGRES_PORT'),
      username: this.configService.getOrThrow('POSTGRES_USER'),
      password: this.configService.getOrThrow('POSTGRES_PASSWORD'),
      database: this.configService.getOrThrow('POSTGRES_DB'),
      entities:
        this.configService.get('NODE_ENV') === 'test'
          ? [join(process.cwd(), 'src', '**', '**/*.entity.{ts,js}')]
          : ['dist/**/*.entity.js'],
      autoLoadEntities: true,
      logging: true,
    };
  }
}