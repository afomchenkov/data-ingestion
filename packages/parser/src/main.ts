import { hostname } from 'os';
import { promises as fs } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Transport, KafkaOptions } from '@nestjs/microservices';
import { WinstonModule, utilities } from 'nest-winston';
import { format, transports } from 'winston';
import { dump } from 'js-yaml';
import { ApiModule } from './modules/api.module';

const setupSwagger = async (app: INestApplication): Promise<void> => {
  const documentBuilder = new DocumentBuilder()
    .setTitle('Parser service')
    .setDescription('Parser MS')
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilder);

  SwaggerModule.setup('api/v1/docs', app, document, {
    customSiteTitle: 'Swagger documentation',
  });

  // generate new doc in dev mode
  if (process.env.NODE_ENV === 'development') {
    await fs.writeFile('swagger.yaml', dump(document));
  }
};

async function bootstrap() {
  const app = await NestFactory.create(ApiModule, {
    bufferLogs: true,
    cors: true,
    logger: WinstonModule.createLogger({
      level: ['development'].includes(process.env.NODE_ENV ?? '')
        ? 'debug'
        : 'info',
      transports: [
        new transports.Console({
          format: ['development'].includes(process.env.NODE_ENV ?? '')
            ? format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                format.ms(),
                utilities.format.nestLike('Parser Service Dev', {
                  colors: true,
                  prettyPrint: true,
                }),
              )
            : format.printf((msg) => {
                const logFormat = {
                  hostname: hostname(),
                  app: process.env.APP_NAME,
                  environment: process.env.NODE_ENV,
                  level: msg.level,
                  msg: msg.message,
                  product: 'Parser Service',
                  time: new Date().toISOString(),
                };

                return JSON.stringify(logFormat);
              }),
        }),
      ],
    }),
  });

  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  const port = configService.getOrThrow('PORT');

  app.connectMicroservice<KafkaOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.getOrThrow<string>('KAFKA_CLIENT_ID'),
        brokers: [configService.getOrThrow<string>('KAFKA_BROKER_URL')],
      },
      consumer: {
        groupId: configService.getOrThrow<string>('KAFKA_CONSUMER_GROUP'),
      },
      // Start from beginning to test
      subscribe: {
        fromBeginning: true,
      },
      // Explicitly subscribe to topics
      run: {
        autoCommit: true,
      },
    },
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: false,
        exposeDefaultValues: true,
      },
    }),
  );

  await setupSwagger(app);

  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
