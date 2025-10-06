import { Injectable } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private ormIndicator: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  checkTerminus() {
    return this.health.check([
      () => this.ormIndicator.pingCheck('database', { timeout: 15000 }),
      () => this.memory.checkHeap('memory_heap', 1000 * 1024 * 1024),
      () => this.memory.checkRSS('memory_RSS', 1000 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk_health', {
          thresholdPercent: 10,
          path: '/',
        }),
    ]);
  }
}
