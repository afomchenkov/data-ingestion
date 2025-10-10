import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);

  constructor() {}
}
