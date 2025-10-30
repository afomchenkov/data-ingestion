import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class UserService {
  private readonly tableName = 'Users';

  constructor(
    @Inject('DYNAMO_CLIENT')
    private readonly dynamoDB: DynamoDBDocumentClient,
  ) { }

  async createUser(user: { id: string; name: string; email: string }) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: user,
    });
    await this.dynamoDB.send(command);
    return user;
  }

  async getUser(id: string) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });
    const { Item } = await this.dynamoDB.send(command);
    return Item;
  }

  async listUsers() {
    const command = new ScanCommand({
      TableName: this.tableName,
    });
    const { Items } = await this.dynamoDB.send(command);
    return Items || [];
  }
}
