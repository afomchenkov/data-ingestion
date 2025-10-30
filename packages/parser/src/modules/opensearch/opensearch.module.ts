import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';
// import aws4 from 'aws4';
// import CredentialProvider from '@aws-sdk/credential-providers';
// import * as httpAwsEs from 'http-aws-es'; // for older clients

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'OPENSEARCH_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const node = configService.get<string>('OPENSEARCH_NODE');
        const region = configService.get<string>('AWS_REGION');

        // if (node?.includes('amazonaws.com')) {
        //   const credentials = await defaultProvider()();

        //   return new Client({
        //     node,
        //     Connection: require('aws-opensearch-connector')({
        //       credentials,
        //       region,
        //     }).Connection,
        //   });
        // }

        // Local OpenSearch (Docker)
        return new Client({ node });
      },
    },
  ],
  exports: ['OPENSEARCH_CLIENT'],
})
export class OpenSearchModule { }
