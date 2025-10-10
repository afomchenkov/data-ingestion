import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FetchFilteredFieldsDto {
  @ApiProperty({ description: 'Name of the data to fetch' })
  @IsString()
  dataName: string;

  @ApiProperty({
    description:
      'Array of JSON field paths to return (e.g., ["user.name", "user.email", "metadata.status"])',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  fields: string[];

  @ApiPropertyOptional({ description: 'Tenant ID to filter by' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
