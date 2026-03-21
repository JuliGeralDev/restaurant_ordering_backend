import { TimelineEvent } from '@/domain/entities/timeline-event.entity';

export interface PaginatedTimelineResult {
  events: TimelineEvent[];
  nextToken?: string;
  hasMore: boolean;
}

export interface TimelineRepository {
  save(event: TimelineEvent): Promise<void>;

  findByOrderId(
    orderId: string,
    pageSize: number,
    nextToken?: string
  ): Promise<PaginatedTimelineResult>;
}