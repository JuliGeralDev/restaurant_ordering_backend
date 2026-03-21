import { randomUUID } from 'crypto';
import { TimelineEvent, TimelineEventType } from '@/domain/entities/timeline-event.entity';

export interface CreateTimelineEventParams {
  orderId: string;
  userId: string;
  type: TimelineEventType;
  correlationId: string;
  payload: Record<string, unknown>;
}

export class TimelineEventFactory {
  static create(params: CreateTimelineEventParams): TimelineEvent {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: params.orderId,
      userId: params.userId,
      type: params.type,
      source: 'api',
      correlationId: params.correlationId,
      payload: params.payload,
    };
  }
}
