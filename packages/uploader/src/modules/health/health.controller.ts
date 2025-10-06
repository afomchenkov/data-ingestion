import { Controller, Get, HttpCode } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';
import { HealthService } from './health.service';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('/liveness')
  @HealthCheck()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get microservice liveness',
    operationId: 'health-liveness',
  })
  @ApiResponse({
    status: 200,
    type: Object,
    description: 'The Health Check is successful',
  })
  @ApiServiceUnavailableResponse({
    description: 'The Health Check is not successful',
  })
  healthcheck(): Object {
    return this.healthService.checkTerminus();
  }
}
