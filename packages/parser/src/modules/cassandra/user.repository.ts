import { client } from './cassandra-client';
import { v4 as uuidv4 } from 'uuid';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
}

export class UserRepository {
  private tableName = 'users';

  async create(user: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    const id = uuidv4();
    await client.execute(
      `INSERT INTO ${this.tableName} (id, name, email) VALUES (?, ?, ?)`,
      [id, user.name, user.email],
      { prepare: true },
    );
    return { id, ...user };
  }

  async findAll(): Promise<UserEntity[]> {
    const result = await client.execute(`SELECT * FROM ${this.tableName}`);
    return result.rows.map((r) => ({
      id: r.id.toString(),
      name: r.name,
      email: r.email,
    }));
  }

  async findById(id: string): Promise<UserEntity | null> {
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id],
      { prepare: true },
    );
    if (result.rowLength === 0) return null;
    const row = result.first();
    return { id: row.id.toString(), name: row.name, email: row.email };
  }

  async delete(id: string): Promise<void> {
    await client.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id],
      { prepare: true },
    );
  }
}
