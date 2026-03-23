import { randomUUID } from 'crypto';
import {
  TimelineEvent,
  TimelineEventSource,
  TimelineEventType,
} from '@/domain/entities/timeline-event.entity';

export interface CreateTimelineEventParams {
  orderId: string;
  userId: string;
  type: TimelineEventType;
  correlationId: string;
  payload: Record<string, unknown>;
  source?: TimelineEventSource;
}

export class TimelineEventFactory {
  static create(params: CreateTimelineEventParams): TimelineEvent {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: params.orderId,
      userId: params.userId,
      type: params.type,
      source: params.source ?? 'api',
      correlationId: params.correlationId,
      payload: params.payload,
    };
  }
}
