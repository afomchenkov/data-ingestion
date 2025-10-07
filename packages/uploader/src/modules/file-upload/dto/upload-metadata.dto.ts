import { ApiProperty } from '@nestjs/swagger';

export class UploadMetadataDto {
  @ApiProperty({
    description: 'Unique identifier for the upload session',
    example: 'a4d4fce3-2340-456c-8565-49c29490d288',
  })
  uploadId: string;

  @ApiProperty({
    description: 'Original name of the uploaded file',
    example: 'document.csv',
  })
  originalFileName: string;

  @ApiProperty({
    description: 'The generated S3 key for storing the file',
    example: 'year/month/day/tenant/a4d4fce3-2340-456c-8565-49c29490d288/upload/76ceb2bc-d250-4477-b309-7dcf91fbbc1d/document.csv',
  })
  s3Key: string;

  @ApiProperty({
    description: 'Pre-signed URL for uploading the file to S3',
    example: 'https://s3.amazonaws.com/bucket/key?signature=123',
  })
  presignedUrl: string;
}
