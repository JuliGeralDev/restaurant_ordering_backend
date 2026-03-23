import { OrderService } from '@/application/services/order.service';
import { TimelineEventFactory } from '@/domain/factories/timeline-event.factory';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';

export interface CompleteOrderPlacementInput {
  orderId: string;
  userId: string;
  correlationId: string;
}

export class OrderPlacementProcessorService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly orderService: OrderService
  ) {}

  async completePlacement(input: CompleteOrderPlacementInput): Promise<void> {
    const order = await this.orderService.findOrThrow(input.orderId);

    if (order.status === 'PLACED') {
      return;
    }

    const previousStatus = order.status;
    order.status = 'PLACED';
    order.updatedAt = new Date().toISOString();

    await this.orderRepository.save(order);

    const statusChangedEvent = TimelineEventFactory.create({
      orderId: order.orderId,
      userId: input.userId,
      type: 'ORDER_STATUS_CHANGED',
      source: 'worker',
      correlationId: input.correlationId,
      payload: {
        from: previousStatus,
        to: order.status,
      },
    });

    await this.timelineRepository.save(statusChangedEvent);
  }

  scheduleCompletion(
    input: CompleteOrderPlacementInput,
    delayMs = 800
  ): void {
    setTimeout(() => {
      void this.completePlacement(input).catch((error) => {
        console.error('Failed to complete asynchronous order placement', error);
      });
    }, delayMs);
  }
}
