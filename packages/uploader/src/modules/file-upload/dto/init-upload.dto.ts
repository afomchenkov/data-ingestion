import { IsString, IsUUID, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateUploadDto {
  @ApiProperty({
    description:
      'Unique name of the file (alphanumeric, underscores, or dashes only; no spaces or special characters)',
    example: 'document_123',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'fileName must contain only letters, numbers, underscores, or dashes (no spaces or special characters)',
  })
  fileName: string;

  @ApiProperty({
    description:
      'Unique name of the data group, think of it as a table name (alphanumeric, underscores, or dashes only; no spaces or special characters)',
    example: 'document_123',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'dataName must contain only letters, numbers, underscores, or dashes (no spaces or special characters)',
  })
  dataName: string;

  @ApiProperty({
    description: 'Type of the file (must be either csv or json)',
    example: 'csv',
    enum: ['csv', 'json', 'ndjson'],
  })
  @IsString()
  @IsIn(['csv', 'json', 'ndjson'], {
    message: 'fileType must be either csv or json',
  })
  fileType: string;

  @ApiProperty({
    description: 'Unique identifier for the tenant',
    example: '67056bc6-0e8b-4112-b2ce-ac8c00e3b9fa',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    description: 'Unique identifier for the validation schema',
    example: '1b59db7c-93a2-4be7-9117-32a553fed88e',
  })
  @IsUUID()
  schemaId: string;
}
