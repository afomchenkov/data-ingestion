import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class SearchService {
  private readonly index = 'users';

  constructor(@Inject('OPENSEARCH_CLIENT') private readonly client: Client) {}

  async createIndex() {
    const exists = await this.client.indices.exists({ index: this.index });
    if (!exists.body) {
      await this.client.indices.create({
        index: this.index,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' },
              email: { type: 'keyword' },
            },
          },
        },
      });
    }
    return { created: !exists.body };
  }

  async indexDocument(user: { id: string; name: string; email: string }) {
    await this.client.index({
      index: this.index,
      id: user.id,
      body: user,
      refresh: true,
    });
    return user;
  }

  async searchByName(name: string) {
    const result = await this.client.search({
      index: this.index,
      body: {
        query: {
          match: { name },
        },
      },
    });
    return result.body.hits.hits.map((h: any) => h._source);
  }
}
