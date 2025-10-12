import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { FileUploadService } from './services/file-upload.service';
import { TenantService, DataSchemaService } from '@data-ingestion/shared';
import {
  InitiateUploadDto,
  IngestJobDto,
  UploadMetadataDto,
  TenantResponseDto,
  CreateTenantDto,
  UploadedFileVersionDto,
  DataSchemaResponseDto,
  IngestJobListDto,
} from './dto';

@ApiTags('Files Upload')
@Controller('files')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly tenantService: TenantService,
    private readonly dataSchemaService: DataSchemaService,
  ) { }

  @Post('/uploads/init')
  @ApiOperation({ summary: 'Initiate a file upload' })
  @ApiBody({ type: InitiateUploadDto })
  @ApiOkResponse({ type: UploadMetadataDto })
  async initiateUpload(
    @Body() payload: InitiateUploadDto,
  ): Promise<UploadMetadataDto> {
    return this.fileUploadService.initiateUpload(payload);
  }

  @Get('/uploads/:uploadId')
  @ApiOperation({ summary: 'Get upload job status' })
  async getUploadStatus(
    @Param('uploadId') uploadId: string,
  ): Promise<IngestJobDto | null> {
    return this.fileUploadService.getUploadStatus(uploadId);
  }

  @Get('/uploads')
  @ApiOperation({ summary: 'Get all ingestion jobs' })
  @ApiQuery({
    name: 'tenant_id',
    required: true,
    type: 'string',
    format: 'uuid',
    description: 'Tenant ID to filter ingestion jobs',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page (default: 50)',
    example: 10,
  })
  @ApiOkResponse({ type: IngestJobListDto })
  async getAllIngestionJobs(
    @Query('tenant_id', new ParseUUIDPipe({ version: '4' })) tenantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ): Promise<IngestJobListDto> {
    return this.fileUploadService.getIngestionJobsByTenant(
      tenantId,
      page,
      limit,
    );
  }

  @Get('/versions')
  @ApiOperation({ summary: 'Get file versions' })
  @ApiQuery({
    name: 'key',
    required: false,
    description: 'Optional file key to filter versions',
  })
  async getFileVersions(
    @Query('key') key?: string,
  ): Promise<UploadedFileVersionDto[]> {
    return this.fileUploadService.getFileVersions(key ?? '');
  }

  @Get('/data-schemas')
  @ApiOperation({ summary: 'Get all data schemas' })
  async getAllDataSchemas(): Promise<DataSchemaResponseDto[]> {
    return this.dataSchemaService.findAll();
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
