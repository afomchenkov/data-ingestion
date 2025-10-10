import { Controller } from '@nestjs/common';
import { IngestDataService } from '../services/ingest-data.service';

@Controller()
export class FileParserController {
  constructor(private readonly ingestService: IngestDataService) {}

  // API: fetch all ingestion jobs per tenant

  // API: fetch specific ingestion job

  // API: fetch all uploaded files per tenant

  // API: fetch file record info

  // API: fetch filtered file fields
}
