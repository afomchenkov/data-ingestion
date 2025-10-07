import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileUploadService } from './services/file-upload.service';
import { TenantService } from '../db/services';
import {
  InitiateUploadDto,
  IngestJobDto,
  UploadMetadataDto,
  TenantResponseDto,
  CreateTenantDto,
  UploadedFileVersionDto,
} from './dto';

@ApiTags('Files Upload')
@Controller('files')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly tenantService: TenantService,
  ) {}

  @Post('/uploads/init')
  @ApiOperation({ summary: 'Initiate a file upload' })
  @ApiBody({ type: InitiateUploadDto })
  @ApiOkResponse({ type: UploadMetadataDto })
  async initiateUpload(
    @Body() payload: InitiateUploadDto,
  ): Promise<UploadMetadataDto> {
    const { fileName, fileType, tenantId } = payload;
    return this.fileUploadService.initiateUpload(fileName, fileType, tenantId);
  }

  @Get('/uploads/:uploadId')
  @ApiOperation({ summary: 'Get upload job status' })
  async getUploadStatus(@Param('uploadId') uploadId: string): Promise<IngestJobDto | null> {
    return this.fileUploadService.getUploadStatus(uploadId);
  }

  @Get('/versions')
  @ApiOperation({ summary: 'Get file versions' })
  async getFileVersions(@Param('key') key: string): Promise<UploadedFileVersionDto[]> {
    return this.fileUploadService.getFileVersions(key);
  }

  @Post('/tenants')
  @ApiOperation({ summary: 'Create a tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  async create(
    @Body() payload: CreateTenantDto,
  ): Promise<TenantResponseDto | null> {
    return this.tenantService.create(payload);
  }

  @Get('/tenants')
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiOkResponse({ type: Array<TenantResponseDto> })
  async getAllTenants(): Promise<TenantResponseDto[]> {
    return this.tenantService.findAll();
  }
}
