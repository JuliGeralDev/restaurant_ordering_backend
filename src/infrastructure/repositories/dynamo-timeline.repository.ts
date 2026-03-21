import { TimelineRepository, PaginatedTimelineResult } from '@/domain/repositories/timeline.repository';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { dynamoDB } from '@/infrastructure/database/dynamo.client';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

export class DynamoTimelineRepository implements TimelineRepository {
  async save(event: TimelineEvent): Promise<void> {
    await dynamoDB.send(
      new PutCommand({
        TableName: 'order_timeline',
        Item: event,
        ConditionExpression: 'attribute_not_exists(eventId)',
      })
    );
  }

  async findByOrderId(
    orderId: string,
    pageSize: number,
    nextToken?: string
  ): Promise<PaginatedTimelineResult> {
    const exclusiveStartKey = nextToken
      ? JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8'))
      : undefined;

    const result = await dynamoDB.send(
      new QueryCommand({
        TableName: 'order_timeline',
        KeyConditionExpression: 'orderId = :orderId',
        ExpressionAttributeValues: {
          ':orderId': orderId,
        },
        Limit: pageSize,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: false, // DESC order by timestamp
      })
    );

    const events = (result.Items as TimelineEvent[]) || [];
    const hasMore = !!result.LastEvaluatedKey;
    const newNextToken = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined;

    return {
      events,
      nextToken: newNextToken,
      hasMore,
    };
  }
}