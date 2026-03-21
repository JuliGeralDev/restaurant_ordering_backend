import { randomUUID } from 'crypto';

import { OrderRepository } from '@/domain/repositories/order.repository';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';

export interface PlaceOrderInput {
  orderId: string;
  userId: string;
  correlationId: string;
}

export interface PlaceOrderOutput {
  orderId: string;
  status: string;
}

export class PlaceOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: TimelineRepository
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    order.status = 'PLACED';
    order.updatedAt = new Date().toISOString();

    await this.orderRepository.save(order);

    const event: TimelineEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: order.orderId,
      userId: input.userId,
      type: 'ORDER_PLACED',
      source: 'api',
      correlationId: input.correlationId,
      payload: {
        status: order.status,
      },
    };

    await this.timelineRepository.save(event);

    return {
      orderId: order.orderId,
      status: order.status,
    };
  }
}