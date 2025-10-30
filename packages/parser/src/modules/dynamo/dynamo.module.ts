import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

@Module({
  providers: [
    {
      provide: 'DYNAMO_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const client = new DynamoDBClient({
          region: configService.getOrThrow('AWS_REGION'),
          endpoint: configService.getOrThrow('DYNAMODB_ENDPOINT'),
          credentials: {
            accessKeyId: configService.getOrThrow('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
          },
        });

        return DynamoDBDocumentClient.from(client);
      },
    },
  ],
  exports: ['DYNAMO_CLIENT'],
})
export class DynamoModule { }
