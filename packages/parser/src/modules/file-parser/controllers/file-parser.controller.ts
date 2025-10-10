import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  FetchDataRecordsDto,
  FetchFilteredFieldsDto,
  ProcessedDataResponseDto,
  FilteredDataResponseDto,
  PaginatedResponseDto,
} from '../dto';
import { FileParserService } from '../services';

@ApiTags('File Parser')
@Controller()
export class FileParserController {
  constructor(private readonly fileParserService: FileParserService) {}

  // API: fetch all ingestion jobs per tenant

  // API: fetch specific ingestion job

  // API: fetch all uploaded files per tenant

  // API: fetch file record info

  // API: fetch filtered file fields

  // API: fetch data records by data_name
  @Get('data-records')
  @ApiOperation({
    summary: 'Fetch data records by data_name',
    description:
      'Retrieve paginated processed data records filtered by data name and optional tenant ID',
  })
  @ApiQuery({
    name: 'dataName',
    required: true,
    type: String,
    description: 'Name of the data to fetch',
  })
  @ApiQuery({
    name: 'tenantId',
    required: false,
    type: String,
    description: 'Tenant ID to filter by',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved data records',
    type: PaginatedResponseDto<ProcessedDataResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async fetchDataRecords(
    @Query(new ValidationPipe({ transform: true })) query: FetchDataRecordsDto,
  ): Promise<PaginatedResponseDto<ProcessedDataResponseDto>> {
    return this.fileParserService.fetchDataRecords(query);
  }

  // API: fetch filtered data fields by provided json fields
  @Post('filtered-fields')
  @ApiOperation({
    summary: 'Fetch filtered data fields by provided json fields',
    description:
      'Retrieve specific JSON fields from processed data records based on provided field paths (e.g., ["user.name", "metadata.status"])',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved filtered data',
    type: PaginatedResponseDto<FilteredDataResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async fetchFilteredFields(
    @Body(new ValidationPipe({ transform: true })) body: FetchFilteredFieldsDto,
  ): Promise<PaginatedResponseDto<FilteredDataResponseDto>> {
    return this.fileParserService.fetchFilteredFields(body);
  }
}
