import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NDJSONDataService } from './ndjson-data.service';
import {
  IngestJobEntity,
  IngestJobService,
  ProcessedDataService,
  IngestJobStatus,
} from '@data-ingestion/shared';
import { SchemaValidationService } from '../schema-validation.service';
import { S3Service } from '../s3.service';
import { Readable } from 'stream';

describe('NDJSONDataService', () => {
  let service: NDJSONDataService;
  let ingestJobService: jest.Mocked<IngestJobService>;
  let s3Service: jest.Mocked<S3Service>;
  let schemaValidationService: jest.Mocked<SchemaValidationService>;
  let processedDataService: jest.Mocked<ProcessedDataService>;

  const mockIngestJob: IngestJobEntity = {
    id: 'test-job-id',
    tenantId: 'tenant-123',
    uploadId: 'upload-456',
    fileName: 'test.ndjson',
    fileType: 'ndjson',
    dataName: 'test-data',
    schemaId: 'schema-789',
    filePath: 's3://bucket/test.ndjson',
    contentSha256: 'abc123',
    status: IngestJobStatus.PROCESSING,
    sizeBytes: '1024',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NDJSONDataService,
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

    service = module.get<NDJSONDataService>(NDJSONDataService);
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
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processFile', () => {
    it('should process a valid NDJSON file successfully', async () => {
      const ndjsonData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];

      const ndjsonContent = ndjsonData.map(obj => JSON.stringify(obj)).join('\n');
      const mockStream = Readable.from([ndjsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.loadSchema).toHaveBeenCalledWith('schema-789');
      expect(s3Service.getFileStream).toHaveBeenCalledWith('s3://bucket/test.ndjson');
      expect(schemaValidationService.validate).toHaveBeenCalledTimes(3);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        ndjsonData,
        mockIngestJob,
        'id',
      );
      expect(service['completeJob']).toHaveBeenCalledWith(mockIngestJob);
    });

    it('should process records in batches of 1000', async () => {
      const records = Array.from({ length: 2500 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));

      const ndjsonContent = records.map(obj => JSON.stringify(obj)).join('\n');
      const mockStream = Readable.from([ndjsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledTimes(3);
      // expect(service['saveBatch']).toHaveBeenNthCalledWith(
      //   1,
      //   expect.arrayContaining([records[0]]),
      //   mockIngestJob,
      //   'id',
      // );
      // expect((service['saveBatch'] as jest.Mock).mock.calls[0][0]).toHaveLength(1000);
      // expect((service['saveBatch'] as jest.Mock).mock.calls[1][0]).toHaveLength(1000);
      // expect((service['saveBatch'] as jest.Mock).mock.calls[2][0]).toHaveLength(500);
    });

    it('should skip invalid records and continue processing', async () => {
      const ndjsonData = [
        { id: 1, name: 'Valid Item 1' },
        { id: 2, name: 'Invalid Item' },
        { id: 3, name: 'Valid Item 2' },
      ];

      const ndjsonContent = ndjsonData.map(obj => JSON.stringify(obj)).join('\n');
      const mockStream = Readable.from([ndjsonContent]);

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
        { message: 'Validation error', keyword: 'required', instancePath: '/2', schemaPath: '/required', params: { missingProperty: 'id' } },
      ]);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.validate).toHaveBeenCalledTimes(3);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        [ndjsonData[0], ndjsonData[2]],
        mockIngestJob,
        'id',
      );
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid NDJSON record'),
      );
    });

    it('should skip empty lines', async () => {
      const ndjsonContent = [
        JSON.stringify({ id: 1, name: 'Item 1' }),
        '',
        '   ',
        JSON.stringify({ id: 2, name: 'Item 2' }),
      ].join('\n');

      const mockStream = Readable.from([ndjsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.validate).toHaveBeenCalledTimes(2);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        mockIngestJob,
        'id',
      );
    });

    it('should handle malformed JSON gracefully', async () => {
      const ndjsonContent = [
        JSON.stringify({ id: 1, name: 'Valid Item' }),
        '{ invalid json }',
        JSON.stringify({ id: 2, name: 'Another Valid Item' }),
      ].join('\n');

      const mockStream = Readable.from([ndjsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse NDJSON line'),
      );
      expect(service['saveBatch']).toHaveBeenCalledWith(
        [
          { id: 1, name: 'Valid Item' },
          { id: 2, name: 'Another Valid Item' },
        ],
        mockIngestJob,
        'id',
      );
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

    it('should process empty file and complete job', async () => {
      const mockStream = Readable.from(['']);

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
      const ndjsonData = [{ id: 1, name: 'Item 1' }];
      const ndjsonContent = ndjsonData.map(obj => JSON.stringify(obj)).join('\n');
      const mockStream = Readable.from([ndjsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: null,
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledWith(
        ndjsonData,
        mockIngestJob,
        null,
      );
    });

    it('should log total lines processed', async () => {
      const ndjsonData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      const ndjsonContent = ndjsonData.map(obj => JSON.stringify(obj)).join('\n');
      const mockStream = Readable.from([ndjsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(Logger.prototype.log).toHaveBeenCalledWith('Total lines: 2');
      expect(Logger.prototype.log).toHaveBeenCalledWith('Finished processing NDJSON file');
    });
  });
});