import { TimelineRepository, PaginatedTimelineResult } from '@/domain/repositories/timeline.repository';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';

export class InMemoryTimelineRepository implements TimelineRepository {
  private events: Map<string, TimelineEvent[]> = new Map();

  async save(event: TimelineEvent): Promise<void> {
    const existingEvents = this.events.get(event.orderId) || [];

    // Deduplication by eventId (requirement)
    const alreadyExists = existingEvents.some(
      (e) => e.eventId === event.eventId
    );

    if (!alreadyExists) {
      existingEvents.push(event);
      this.events.set(event.orderId, existingEvents);
    }
  }

  async findByOrderId(
    orderId: string,
    pageSize: number,
    nextToken?: string
  ): Promise<PaginatedTimelineResult> {
    const events = this.events.get(orderId) || [];

    // Sort by timestamp (requirement)
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // For in-memory, nextToken is the index position encoded in base64
    let startIndex = 0;
    if (nextToken) {
      try {
        startIndex = parseInt(Buffer.from(nextToken, 'base64').toString('utf-8'), 10);
      } catch (error) {
        throw new Error('Invalid pagination token');
      }
    }

    const endIndex = startIndex + pageSize;
    const paginatedEvents = sorted.slice(startIndex, endIndex);
    const hasMore = endIndex < sorted.length;

    let newNextToken: string | undefined;
    if (hasMore) {
      newNextToken = Buffer.from(endIndex.toString()).toString('base64');
    }

    return {
      events: paginatedEvents,
      nextToken: newNextToken,
      hasMore
    };
  }
}