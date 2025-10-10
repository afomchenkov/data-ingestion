import { ApiProperty } from '@nestjs/swagger';

export class DataSchemaResponseDto {
  @ApiProperty({ description: 'Unique identifier (UUID) of the schema' })
  id: string;

  @ApiProperty({
    description: 'Date when schema record was created (ISO timestamp)',
    example: '2025-01-20T12:34:56.789Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Date when schema record was last updated (ISO timestamp)',
    example: '2025-01-21T09:10:11.123Z',
  })
  updatedAt: string;

  @ApiProperty({ description: 'Schema name', example: 'Customer Data Schema' })
  name: string;

  @ApiProperty({
    description: 'Optional description of the schema',
    example: 'Schema for processing customer records',
  })
  description?: string;

  @ApiProperty({
    description: 'Tenant ID that owns this schema (UUID)',
    example: 'b6a4bcd5-08d9-4c6f-a7e1-2e2bb342dd7c',
    required: false,
  })
  tenantId?: string;

  @ApiProperty({
    description: 'JSON schema definition',
    example: {
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'number' } },
    },
  })
  schema: Record<string, any>;

  @ApiProperty({
    description: 'File type for data import',
    enum: ['csv', 'ndjson', 'json'],
    example: 'csv',
  })
  file_type: 'csv' | 'ndjson' | 'json';

  @ApiProperty({
    description: 'Delimiter used in CSV files',
    example: ',',
    default: ',',
  })
  delimiter: string;
}
