import { Controller, Get } from '@nestjs/common';
import { FileParserService } from '../services/file-parser.service';

@Controller()
export class FileParserController {
  constructor(private readonly appService: FileParserService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
