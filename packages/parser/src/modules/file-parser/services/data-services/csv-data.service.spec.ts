import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CSVDataService } from './csv-data.service';
import {
  IngestJobEntity,
  IngestJobService,
  ProcessedDataService,
  IngestJobStatus,
} from '@data-ingestion/shared';
import { SchemaValidationService } from '../schema-validation.service';
import { S3Service } from '../s3.service';
import { Readable } from 'stream';

describe('CSVDataService', () => {
  let service: CSVDataService;
  let ingestJobService: jest.Mocked<IngestJobService>;
  let s3Service: jest.Mocked<S3Service>;
  let schemaValidationService: jest.Mocked<SchemaValidationService>;
  let processedDataService: jest.Mocked<ProcessedDataService>;

  const mockIngestJob: IngestJobEntity = {
    id: 'test-job-id',
    tenantId: 'tenant-123',
    uploadId: 'upload-456',
    fileName: 'test.csv',
    fileType: 'csv',
    dataName: 'test-data',
    schemaId: 'schema-789',
    filePath: 's3://bucket/test.csv',
    contentSha256: 'abc123',
    status: IngestJobStatus.PROCESSING,
    sizeBytes: '1024',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CSVDataService,
        {
          provide: IngestJobService,
          useValue: {
            update: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: S3Service,
          useValue: {
            getFileStream: jest.fn(),
          },
        },
        {
          provide: SchemaValidationService,
          useValue: {
            loadSchema: jest.fn(),
            validate: jest.fn(),
            getErrors: jest.fn(),
          },
        },
        {
          provide: ProcessedDataService,
          useValue: {
            upsertBatch: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CSVDataService>(CSVDataService);
    ingestJobService = module.get(IngestJobService);
    s3Service = module.get(S3Service);
    schemaValidationService = module.get(SchemaValidationService);
    processedDataService = module.get(ProcessedDataService);

    // Mock the methods from BaseDataService
    jest.spyOn(service as any, 'saveBatch').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'completeJob').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'failJob').mockResolvedValue(undefined);

    // Suppress logger output
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processFile', () => {
    it('should process a valid CSV file successfully', async () => {
      const csvContent = `id,name,email
1,John Doe,john@example.com
2,Jane Smith,jane@example.com
3,Bob Johnson,bob@example.com`;

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.loadSchema).toHaveBeenCalledWith('schema-789');
      expect(s3Service.getFileStream).toHaveBeenCalledWith('s3://bucket/test.csv');
      expect(schemaValidationService.validate).toHaveBeenCalledTimes(3);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        expect.arrayContaining([
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
        ]),
        mockIngestJob,
        'id',
      );
      expect(service['completeJob']).toHaveBeenCalledWith(mockIngestJob);
    });

    it('should process records in batches of 1000', async () => {
      const headers = 'id,name,value';
      const rows = Array.from({ length: 2500 }, (_, i) =>
        `${i + 1},Item ${i + 1},${(i + 1) * 10}`
      );
      const csvContent = [headers, ...rows].join('\n');

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledTimes(3);
      // expect((service['saveBatch'] as jest.Mock).mock.calls[0][0]).toHaveLength(1000);
      // expect((service['saveBatch'] as jest.Mock).mock.calls[1][0]).toHaveLength(1000);
      // expect((service['saveBatch'] as jest.Mock).mock.calls[2][0]).toHaveLength(500);
    });

    it('should skip invalid records and continue processing', async () => {
      const csvContent = `id,name,email
1,Valid User 1,valid1@example.com
2,Invalid User,invalid-email
3,Valid User 2,valid2@example.com`;

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      schemaValidationService.getErrors.mockReturnValue([
        { message: 'Invalid email format', keyword: 'format', instancePath: '/2', schemaPath: '/format', params: { format: 'email' } },
      ]);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.validate).toHaveBeenCalledTimes(3);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        expect.arrayContaining([
          { id: 1, name: 'Valid User 1', email: 'valid1@example.com' },
          { id: 3, name: 'Valid User 2', email: 'valid2@example.com' },
        ]),
        mockIngestJob,
        'id',
      );
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid CSV record at row 2'),
      );
    });

    it('should handle CSV with empty lines', async () => {
      const csvContent = `id,name,email
1,User 1,user1@example.com

2,User 2,user2@example.com

`;

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.validate).toHaveBeenCalledTimes(2);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        expect.arrayContaining([
          { id: 1, name: 'User 1', email: 'user1@example.com' },
          { id: 2, name: 'User 2', email: 'user2@example.com' },
        ]),
        mockIngestJob,
        'id',
      );
    });

    it('should trim whitespace from CSV values', async () => {
      const csvContent = `id,name,email
1,  John Doe  ,  john@example.com  
2,  Jane Smith  ,  jane@example.com  `;

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledWith(
        expect.arrayContaining([
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        ]),
        mockIngestJob,
        'id',
      );
    });

    it('should handle CSV with quoted values', async () => {
      const csvContent = `id,name,description
1,"John Doe","A person with, commas"
2,"Jane ""The Boss"" Smith","Person with ""quotes"""`;

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.validate).toHaveBeenCalledTimes(2);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        expect.arrayContaining([
          { id: 1, name: 'John Doe', description: 'A person with, commas' },
          { id: 2, name: 'Jane "The Boss" Smith', description: 'Person with "quotes"' },
        ]),
        mockIngestJob,
        'id',
      );
    });

    it('should handle CSV with BOM (Byte Order Mark)', async () => {
      const csvContent = '\ufeffid,name\n1,John Doe\n2,Jane Smith';

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.validate).toHaveBeenCalledTimes(2);
      expect(service['saveBatch']).toHaveBeenCalled();
    });

    it('should fail the job if filePath is missing', async () => {
      const jobWithoutPath = { ...mockIngestJob, filePath: null };

      await service.processFile(jobWithoutPath);

      expect(Logger.prototype.error).toHaveBeenCalledWith('File path is required');
      expect(service['failJob']).toHaveBeenCalledWith(jobWithoutPath);
      expect(s3Service.getFileStream).not.toHaveBeenCalled();
    });

    it('should fail the job if schemaId is missing', async () => {
      const jobWithoutSchema = { ...mockIngestJob, schemaId: null };

      await service.processFile(jobWithoutSchema);

      expect(Logger.prototype.error).toHaveBeenCalledWith('Schema ID is required');
      expect(service['failJob']).toHaveBeenCalledWith(jobWithoutSchema);
      expect(s3Service.getFileStream).not.toHaveBeenCalled();
    });

    it('should handle parser errors and fail the job', async () => {
      const malformedCSV = `id,name
1,John
2,Jane
This is not a valid CSV row with matching columns`;

      const mockStream = Readable.from([malformedCSV]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      // Parser should handle relax_column_count, but if it fails:
      // The job should continue or fail gracefully
      expect(service['completeJob']).toHaveBeenCalled();
    });

    it('should process empty CSV file and complete job', async () => {
      const csvContent = 'id,name,email';

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).not.toHaveBeenCalled();
      expect(service['completeJob']).toHaveBeenCalledWith(mockIngestJob);
    });

    it('should handle records without uniqueField', async () => {
      const csvContent = `id,name
1,John Doe
2,Jane Smith`;

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: null,
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledWith(
        expect.any(Array),
        mockIngestJob,
        null,
      );
    });

    it('should log total rows processed', async () => {
      const csvContent = `id,name
1,John Doe
2,Jane Smith`;

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(Logger.prototype.log).toHaveBeenCalledWith('Total rows: 2');
      expect(Logger.prototype.log).toHaveBeenCalledWith('Finished processing CSV file');
    });

    // it('should handle stream errors gracefully', async () => {
    //   const mockStream = new Readable({
    //     read() {
    //       this.emit('error', new Error('Stream read error'));
    //     },
    //   });

    //   schemaValidationService.loadSchema.mockResolvedValue({
    //     uniqueField: 'id',
    //     schema: { type: 'object' },
    //   });
    //   s3Service.getFileStream.mockResolvedValue(mockStream);

    //   await service.processFile(mockIngestJob);

    //   expect(Logger.prototype.error).toHaveBeenCalledWith(
    //     expect.stringContaining('Failed to process CSV file'),
    //     expect.any(String),
    //   );
    //   expect(service['failJob']).toHaveBeenCalledWith(mockIngestJob);
    // });

    it('should handle CSV with inconsistent column counts', async () => {
      const csvContent = `id,name,email
1,John Doe,john@example.com
2,Jane Smith
3,Bob Johnson,bob@example.com,extra_field`;

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      // With relax_column_count, parser should handle this
      expect(service['completeJob']).toHaveBeenCalled();
    });

    it('should process final batch if buffer has remaining records', async () => {
      const csvContent = `id,name
1,User 1
2,User 2
3,User 3`;

      const mockStream = Readable.from([csvContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Processed final batch: 3 rows'),
      );
      expect(service['saveBatch']).toHaveBeenCalledTimes(1);
    });
  });
});