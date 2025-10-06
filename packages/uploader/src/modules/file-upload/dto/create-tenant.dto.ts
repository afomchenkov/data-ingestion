import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant name', example: 'Test tenant' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Phone number of the tenant',
    example: '+49(162)123-4567',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    description: 'Tenant email address',
    example: 'admin@test.com',
  })
  @IsEmail()
  email: string;
}
