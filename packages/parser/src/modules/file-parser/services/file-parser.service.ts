import { Injectable } from '@nestjs/common';

@Injectable()
export class FileParserService {
  getHello(): string {
    return 'Hello World!';
  }
}
