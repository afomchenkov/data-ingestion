import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.getOrThrow('AWS_LOCALSTACK_URL');
    const requiredForcePathStyle = this.configService.getOrThrow('AWS_FORCE_PATH_STYLE');

    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
      endpoint,
      forcePathStyle: requiredForcePathStyle === 'true',
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.getOrThrow('AWS_S3_RAW_DATA_BUCKET');
  }

  async generatePresignedUploadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    this.logger.log(`Presigned URL key: ${key}`);
    this.logger.log(`Presigned URL issued: ${presignedUrl}`);

    return presignedUrl;;
  }

  async getFileStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const response = await this.s3Client.send(command);
    return response.Body as Readable;
  }

  async uploadChunk(key: string, data: Buffer): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: data,
    });
    await this.s3Client.send(command);
  }
}
