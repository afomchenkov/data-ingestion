import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3ServiceException,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  ObjectVersion,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost, PresignedPost } from '@aws-sdk/s3-presigned-post';
import { Readable } from 'stream';
import { fileTypeFromBuffer } from 'file-type';
import { streamToBuffer } from '../utils';

const ALLOWED_TYPES = ['text/csv', 'application/json'];

type DeclaredFileType = 'csv' | 'json';

// TODO: use ClamAV antivirus engine to scan for viruses

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.getOrThrow('AWS_LOCALSTACK_URL');
    const requiredForcePathStyle = this.configService.getOrThrow(
      'AWS_FORCE_PATH_STYLE',
    );

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
    expiresIn = 3600, // default to 1 hour
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      // ContentType: contentType,
      ACL: 'private',
    });
    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    this.logger.log(`Presigned URL key: ${key}`);
    this.logger.log(`Presigned URL issued: ${presignedUrl}`);

    return presignedUrl;
  }

  async generatePresignedPost(
    key: string,
    expiresIn = 3600, // default to 1 hour
  ): Promise<PresignedPost> {
    const maxSize = 5 * 1024 * 1024; // restrict upload size to 5MB

    const presignedPost = await createPresignedPost(this.s3Client, {
      Bucket: this.bucketName,
      Key: key,
      Conditions: [['content-length-range', 0, maxSize]],
      Expires: expiresIn,
    });

    return presignedPost;
  }

  async getFileVersions(key: string): Promise<any[]> {
    const command = new ListObjectVersionsCommand({
      Bucket: this.bucketName,
      Prefix: key, // full path or prefix
    });

    const response = await this.s3Client.send(command);

    if (!response.Versions || response.Versions.length === 0) {
      this.logger.warn(`No versions found for key: ${key}`);
      return [];
    }

    const versions = response.Versions.map((v: ObjectVersion) => ({
      key: v.Key,
      checksumType: v.ChecksumType,
      checksumAlgorithm: v.ChecksumAlgorithm,
      versionId: v.VersionId,
      isLatest: v.IsLatest,
      size: v.Size,
      lastModified: v.LastModified,
    }));

    this.logger.log(`Found ${versions.length} versions for [${key}]`);

    return versions;
  }

  async isValidateFileType(
    s3Key: string,
    declaredFileType: DeclaredFileType,
  ): Promise<string | null> {
    try {
      this.logger.log(`Validating file type for: ${s3Key}`);

      const fileStream = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );
      const fileBuffer = await streamToBuffer(fileStream.Body as Readable);
      const fileType = await fileTypeFromBuffer(fileBuffer);

      this.logger.log(`Detected file type: ${fileType?.mime || 'unknown'}`);

      if (!fileType) {
        const message = `Invalid file type detected for ${s3Key} (unknown).`;
        this.logger.warn(message);

        return message;
      }

      if (!ALLOWED_TYPES.includes(fileType.mime)) {
        const message = `Invalid file type detected for ${s3Key} (${fileType?.mime}).`;
        this.logger.warn(message);

        return message;
      }

      if (declaredFileType === fileType.mime.split('/')[1]) {
        const message = `Invalid file type detected for ${s3Key} (${fileType?.mime}), declared file type is ${declaredFileType}.`;
        this.logger.warn(message);

        return message;
      }

      return null;
    } catch (err) {
      const message = `Error validating file type for: ${s3Key} - ${JSON.stringify(err)}`;
      this.logger.error(message);

      if (err instanceof S3ServiceException) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          return `${message} - ${err.name}`;
        }
        throw err;
      }

      return message;
    }
  }

  async checkIfFileExists(s3Key: string): Promise<boolean> {
    try {
      this.logger.log(`Checking if file exists: ${s3Key}`);

      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );

      return true;
    } catch (err) {
      this.logger.error(
        `Error checking if file exists: ${s3Key} - ${JSON.stringify(err)}`,
      );

      if (err instanceof S3ServiceException) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          return false;
        }
        throw err;
      }

      return true;
    }
  }

  async listAllKeys(
    prefix?: string,
  ): Promise<{ files: string[]; directories: string[] }> {
    const files: string[] = [];
    const directories: Set<string> = new Set();
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.s3Client.send(command);

      response.Contents?.forEach((item) => {
        if (item.Key) {
          files.push(item.Key);

          // simulate directory detection (anything before last '/')
          const parts = item.Key.split('/');
          if (parts.length > 1) {
            parts.pop(); // remove filename
            directories.add(parts.join('/'));
          }
        }
      });

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    this.logger.log(`Found ${files.length} files`);
    this.logger.log(`Found ${directories.size} directories`);

    return {
      files,
      directories: Array.from(directories),
    };
  }

  async getFileStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const response = await this.s3Client.send(command);
    return response.Body as Readable;
  }

  async deleteFile(s3Key: string): Promise<void> {
    this.logger.log(`Deleting file: ${s3Key}`);

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );
    } catch (err) {
      this.logger.error(
        `Error deleting file: ${s3Key} - ${JSON.stringify(err)}`,
      );
      throw err;
    }

    this.logger.log(`File deleted: ${s3Key}`);
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
