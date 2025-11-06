import { Injectable } from '@nestjs/common';
import { client } from './cassandra-client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  async createUser(name: string, email: string) {
    const id = uuidv4();
    await client.execute(
      'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
      [id, name, email],
      { prepare: true },
    );
    return { id, name, email };
  }

  async getAllUsers() {
    const result = await client.execute('SELECT * FROM users');
    return result.rows;
  }
}
