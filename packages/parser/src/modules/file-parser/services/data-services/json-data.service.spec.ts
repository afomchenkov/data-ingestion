import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { JSONDataService } from './json-data.service';
import {
  IngestJobEntity,
  IngestJobService,
  ProcessedDataService,
  IngestJobStatus,
} from '@data-ingestion/shared';
import { SchemaValidationService } from '../schema-validation.service';
import { S3Service } from '../s3.service';
import { Readable } from 'stream';

describe('JSONDataService', () => {
  let service: JSONDataService;
  let ingestJobService: jest.Mocked<IngestJobService>;
  let s3Service: jest.Mocked<S3Service>;
  let schemaValidationService: jest.Mocked<SchemaValidationService>;
  let processedDataService: jest.Mocked<ProcessedDataService>;

  const mockIngestJob: IngestJobEntity = {
    id: 'test-job-id',
    tenantId: 'tenant-123',
    uploadId: 'upload-456',
    fileName: 'test.json',
    fileType: 'json',
    dataName: 'test-data',
    schemaId: 'schema-789',
    filePath: 's3://bucket/test.json',
    contentSha256: 'abc123',
    status: IngestJobStatus.PROCESSING,
    sizeBytes: '1024',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JSONDataService,
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

    service = module.get<JSONDataService>(JSONDataService);
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
    it('should process a valid JSON array successfully', async () => {
      const jsonData = [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
        { id: 3, name: 'Item 3', value: 300 },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.loadSchema).toHaveBeenCalledWith('schema-789');
      expect(s3Service.getFileStream).toHaveBeenCalledWith('s3://bucket/test.json');
      expect(schemaValidationService.validate).toHaveBeenCalledTimes(3);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        jsonData,
        mockIngestJob,
        'id',
      );
      expect(service['completeJob']).toHaveBeenCalledWith(mockIngestJob);
    });

    it('should process records in batches of 1000', async () => {
      const records = Array.from({ length: 2500 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: (i + 1) * 10,
      }));

      const jsonContent = JSON.stringify(records);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledTimes(3);
      expect((service['saveBatch'] as jest.Mock).mock.calls[0][0]).toHaveLength(1000);
      expect((service['saveBatch'] as jest.Mock).mock.calls[1][0]).toHaveLength(1000);
      expect((service['saveBatch'] as jest.Mock).mock.calls[2][0]).toHaveLength(500);
    });

    it('should skip invalid records and continue processing', async () => {
      const jsonData = [
        { id: 1, name: 'Valid Item 1', value: 100 },
        { id: 2, name: 'Invalid Item', value: 'invalid' },
        { id: 3, name: 'Valid Item 2', value: 300 },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

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
        { message: 'Invalid value type', keyword: 'type', instancePath: '/2', schemaPath: '/type', params: { type: 'number' } },
      ]);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.validate).toHaveBeenCalledTimes(3);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        [jsonData[0], jsonData[2]],
        mockIngestJob,
        'id',
      );
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid JSON record at index'),
      );
    });

    it('should handle nested JSON objects', async () => {
      const jsonData = [
        {
          id: 1,
          name: 'User 1',
          address: {
            street: '123 Main St',
            city: 'New York',
          },
        },
        {
          id: 2,
          name: 'User 2',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
          },
        },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(schemaValidationService.validate).toHaveBeenCalledTimes(2);
      expect(service['saveBatch']).toHaveBeenCalledWith(
        jsonData,
        mockIngestJob,
        'id',
      );
    });

    it('should handle JSON with arrays in objects', async () => {
      const jsonData = [
        {
          id: 1,
          name: 'Product 1',
          tags: ['electronics', 'gadget'],
        },
        {
          id: 2,
          name: 'Product 2',
          tags: ['clothing', 'accessories'],
        },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledWith(
        jsonData,
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

    it('should handle malformed JSON and fail the job', async () => {
      const malformedJSON = '{ invalid json }';
      const mockStream = Readable.from([malformedJSON]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);

      await service.processFile(mockIngestJob);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process JSON file'),
        expect.any(String),
      );
      expect(service['failJob']).toHaveBeenCalledWith(mockIngestJob);
    });

    it('should process empty JSON array and complete job', async () => {
      const jsonContent = JSON.stringify([]);
      const mockStream = Readable.from([jsonContent]);

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
      const jsonData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: null,
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledWith(
        jsonData,
        mockIngestJob,
        null,
      );
    });

    it('should log total items processed', async () => {
      const jsonData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(Logger.prototype.log).toHaveBeenCalledWith('Total items: 2');
      expect(Logger.prototype.log).toHaveBeenCalledWith('Finished processing JSON array');
    });

    it('should log progress every 10000 items', async () => {
      const records = Array.from({ length: 15000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));

      const jsonContent = JSON.stringify(records);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(Logger.prototype.log).toHaveBeenCalledWith('Progress: 10000 items processed');
    });

    it('should handle stream errors gracefully', async () => {
      const mockStream = new Readable({
        read() {
          this.emit('error', new Error('Stream read error'));
        },
      });

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);

      await service.processFile(mockIngestJob);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process JSON file'),
        expect.any(String),
      );
      expect(service['failJob']).toHaveBeenCalledWith(mockIngestJob);
    });

    it('should skip batches with no valid items', async () => {
      const jsonData = [
        { id: 1, name: 'Invalid Item 1' },
        { id: 2, name: 'Invalid Item 2' },
        { id: 3, name: 'Invalid Item 3' },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(false);
      schemaValidationService.getErrors.mockReturnValue([
        { message: 'Validation failed', keyword: 'required', instancePath: '/2', schemaPath: '/required', params: { missingProperty: 'id' } },
      ]);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).not.toHaveBeenCalled();
      expect(service['completeJob']).toHaveBeenCalledWith(mockIngestJob);
    });

    it('should handle JSON with null values', async () => {
      const jsonData = [
        { id: 1, name: 'Item 1', description: null },
        { id: 2, name: null, description: 'Description 2' },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledWith(
        jsonData,
        mockIngestJob,
        'id',
      );
    });

    it('should handle JSON with boolean and numeric values', async () => {
      const jsonData = [
        { id: 1, name: 'Item 1', active: true, count: 100 },
        { id: 2, name: 'Item 2', active: false, count: 0 },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledWith(
        jsonData,
        mockIngestJob,
        'id',
      );
    });

    it('should handle large JSON files with chunked streaming', async () => {
      const records = Array.from({ length: 5000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        data: 'x'.repeat(100),
      }));

      const jsonContent = JSON.stringify(records);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledTimes(5);
      expect(service['completeJob']).toHaveBeenCalledWith(mockIngestJob);
    });

    it('should handle partial batch validation failures', async () => {
      const jsonData = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);

      // Make every other item invalid
      schemaValidationService.validate.mockImplementation(() => {
        return schemaValidationService.validate.mock.calls.length % 2 === 1;
      });
      schemaValidationService.getErrors.mockReturnValue([
        { message: 'Validation failed', keyword: 'required', instancePath: '/2', schemaPath: '/required', params: { missingProperty: 'id' } },
      ]);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalled();
      const savedItems = (service['saveBatch'] as jest.Mock).mock.calls[0][0];
      expect(savedItems.length).toBeLessThan(jsonData.length);
    });

    it('should handle JSON with deeply nested structures', async () => {
      const jsonData = [
        {
          id: 1,
          level1: {
            level2: {
              level3: {
                value: 'deep value',
              },
            },
          },
        },
      ];

      const jsonContent = JSON.stringify(jsonData);
      const mockStream = Readable.from([jsonContent]);

      schemaValidationService.loadSchema.mockResolvedValue({
        uniqueField: 'id',
        schema: { type: 'object' },
      });
      s3Service.getFileStream.mockResolvedValue(mockStream);
      schemaValidationService.validate.mockReturnValue(true);

      await service.processFile(mockIngestJob);

      expect(service['saveBatch']).toHaveBeenCalledWith(
        jsonData,
        mockIngestJob,
        'id',
      );
    });
  });
});