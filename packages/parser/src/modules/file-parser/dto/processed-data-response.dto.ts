import { ApiProperty } from '@nestjs/swagger';

export class ProcessedDataResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string | null;

  @ApiProperty()
  dataName: string;

  @ApiProperty()
  schemaId: string | null;

  @ApiProperty()
  contentHash: string;

  @ApiProperty()
  uniqueKeyValue: string;

  @ApiProperty()
  data: Record<string, any>;

  @ApiProperty()
  ingestJobId: string | null;
}
