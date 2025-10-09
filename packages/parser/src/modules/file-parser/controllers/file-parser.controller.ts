import { Controller } from '@nestjs/common';
import { FileParserService } from '../services/file-parser.service';

@Controller()
export class FileParserController {
  constructor(private readonly appService: FileParserService) {}

  // API: fetch all files per tenant

  // API: fetch file record info

  // API: fetch filtered file fields
}
