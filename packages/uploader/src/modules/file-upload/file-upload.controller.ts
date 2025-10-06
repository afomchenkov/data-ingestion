import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileUploadService } from './services/file-upload.service';
import { TenantService } from '../db/services';
import {
  InitiateUploadDto,
  UploadMetadataDto,
  TenantResponseDto,
  CreateTenantDto,
} from './dto';

@ApiTags('Files Upload')
@Controller('files')
export class FileUploadController {
  constructor(
    private fileUploadService: FileUploadService,
    private tenantService: TenantService,
  ) {}

  @Post('initiate-upload')
  @ApiOperation({ summary: 'Initiate a file upload' })
  @ApiBody({ type: InitiateUploadDto })
  @ApiOkResponse({ type: UploadMetadataDto })
  async initiateUpload(
    @Body() payload: InitiateUploadDto,
  ): Promise<UploadMetadataDto> {
    const { fileName, tenantId } = payload;
    return this.fileUploadService.initiateUpload(fileName, tenantId);
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Create a tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  async create(
    @Body() payload: CreateTenantDto,
  ): Promise<TenantResponseDto | null> {
    return this.tenantService.create(payload);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiOkResponse({ type: Array<TenantResponseDto> })
  async getAllTenants(): Promise<TenantResponseDto[]> {
    return this.tenantService.findAll();
  }

  @Get('tenants/:tenantId')
  @ApiOperation({ summary: 'Get a tenant by id' })
  @ApiOkResponse({ type: TenantResponseDto })
  async getTenantById(
    @Param('tenantId') tenantId: string,
  ): Promise<TenantResponseDto | null> {
    return this.tenantService.findOne(tenantId);
  }
}
