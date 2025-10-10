import { Controller } from '@nestjs/common';
import { FileParserService } from '../services';

@Controller()
export class FileParserController {
  constructor(private readonly fileParserService: FileParserService) {}

  // API: fetch all ingestion jobs per tenant

  // API: fetch specific ingestion job

  // API: fetch all uploaded files per tenant

  // API: fetch file record info

  // API: fetch filtered file fields
}
