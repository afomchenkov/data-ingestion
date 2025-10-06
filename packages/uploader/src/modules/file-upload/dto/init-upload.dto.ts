import { IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateUploadDto {
  @ApiProperty({
    description: 'Name of the file to be uploaded (must be CSV or JSON, including extension)',
    example: 'document.csv',
  })
  @IsString()
  @Matches(/\.(csv|json)$/i, {
    message: 'fileName must end with .csv or .json',
  })
  fileName: string;

  @ApiProperty({
    description: 'Unique identifier for the tenant',
    example: '67056bc6-0e8b-4112-b2ce-ac8c00e3b9fa',
  })
  @IsUUID()
  tenantId: string;
}
