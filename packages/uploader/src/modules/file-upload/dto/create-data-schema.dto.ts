import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDataSchemaDto {
  @ApiProperty({ description: 'Schema name', example: 'Customer Data Schema' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Optional description of the schema',
    example: 'Schema for processing customer records',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tenant ID that owns this schema (UUID)',
    example: 'b6a4bcd5-08d9-4c6f-a7e1-2e2bb342dd7c',
    required: false,
  })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({
    description: 'JSON schema definition',
    example: {
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'number' } },
    },
  })
  @IsObject()
  @IsNotEmpty()
  schema: Record<string, any>;

  @ApiProperty({
    description: 'File type for data import',
    enum: ['csv', 'ndjson', 'json'],
    example: 'csv',
  })
  @IsEnum(['csv', 'ndjson', 'json'])
  file_type: 'csv' | 'ndjson' | 'json';

  @ApiProperty({
    description: 'Delimiter used in CSV files',
    example: ',',
    default: ',',
    required: false,
  })
  @IsString()
  @IsOptional()
  delimiter?: string;
}
