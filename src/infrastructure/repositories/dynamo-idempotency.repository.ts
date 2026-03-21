import { IdempotencyRepository } from '@/domain/repositories/idempotency.repository';
import { IdempotencyRecord } from '@/domain/entities/idempotency.entity';
import { dynamoDB } from '@/infrastructure/database/dynamo.client';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

export class DynamoIdempotencyRepository implements IdempotencyRepository {
  async findByKey(key: string): Promise<IdempotencyRecord | null> {
    const result = await dynamoDB.send(
      new GetCommand({
        TableName: 'idempotency',
        Key: { key },
      })
    );

    return (result.Item as IdempotencyRecord) || null;
  }

  async save(record: IdempotencyRecord): Promise<void> {
    await dynamoDB.send(
      new PutCommand({
        TableName: 'idempotency',
        Item: record,
      })
    );
  }
}