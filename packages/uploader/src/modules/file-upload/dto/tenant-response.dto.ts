import { ApiProperty } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty({ description: 'Unique identifier (UUID) of the tenant' })
  id: string;

  @ApiProperty({
    description: 'Date when tenant record was created (ISO timestamp)',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Date when tenant record was last updated (ISO timestamp)',
  })
  updatedAt: string;

  @ApiProperty({ description: 'Tenant name', example: 'Test tenant' })
  name: string;

  @ApiProperty({
    description: 'Phone number of the tenant',
    example: '+49(162)123-4567',
  })
  phone: string;

  @ApiProperty({
    description: 'Tenant email address',
    example: 'admin@test.com',
  })
  email: string;
}
