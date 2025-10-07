import { IsString, IsBoolean, IsNumber, IsArray, IsDate, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UploadedFileVersionDto {
  @ApiPropertyOptional({ description: 'File key' })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({ description: 'Checksum type' })
  @IsOptional()
  @IsString()
  checksumType?: string;

  @ApiPropertyOptional({ description: 'Checksum algorithms', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checksumAlgorithm?: string[];

  @ApiPropertyOptional({ description: 'Version ID' })
  @IsOptional()
  @IsString()
  versionId?: string;

  @ApiPropertyOptional({ description: 'Is latest version', default: false })
  @IsOptional()
  @IsBoolean()
  isLatest?: boolean;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({ description: 'Last modified date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastModified?: Date;
}