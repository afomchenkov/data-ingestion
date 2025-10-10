import { ApiProperty } from '@nestjs/swagger';

export class FilteredDataResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  uniqueKeyValue: string;

  @ApiProperty({
    description: 'Filtered data containing only requested fields',
  })
  data: Record<string, any>;
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
