import { IsString, IsUUID, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateUploadDto {
  @ApiProperty({
    description: 'Unique name of the file (alphanumeric, underscores, or dashes only; no spaces or special characters)',
    example: 'document_123',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'fileName must contain only letters, numbers, underscores, or dashes (no spaces or special characters)',
  })
  fileName: string;

  @ApiProperty({
    description: 'Type of the file (must be either csv or json)',
    example: 'csv',
    enum: ['csv', 'json'],
  })
  @IsString()
  @IsIn(['csv', 'json'], {
    message: 'fileType must be either csv or json',
  })
  fileType: string;

  @ApiProperty({
    description: 'Unique identifier for the tenant',
    example: '67056bc6-0e8b-4112-b2ce-ac8c00e3b9fa',
  })
  @IsUUID()
  tenantId: string;
}