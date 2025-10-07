import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class RawQueryService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async query<T = any>(query: string, parameters?: any[]): Promise<T[]> {
    return this.dataSource.query(query, parameters);
  }

  async queryInTransaction<T = any>(
    query: string,
    parameters?: any[],
  ): Promise<T[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.query(query, parameters);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async batchQueryInTransaction<T = any>(
    queries: Array<{ query: string; parameters?: any[] }>,
  ): Promise<T[][]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const results: T[][] = [];
      for (const { query, parameters } of queries) {
        const result = await queryRunner.query(query, parameters);
        results.push(result);
      }
      await queryRunner.commitTransaction();
      return results;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async queryOne<T = any>(
    query: string,
    parameters?: any[],
  ): Promise<T | null> {
    const results = await this.query<T>(query, parameters);
    return results.length > 0 ? results[0] : null;
  }

  async execute(query: string, parameters?: any[]): Promise<number> {
    const result = await this.dataSource.query(query, parameters);
    return result.affectedRows || result.length || 0;
  }

  async transaction<T>(
    callback: (queryRunner: any) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}