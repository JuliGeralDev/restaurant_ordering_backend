import { OrderRepository } from '@/domain/repositories/order.repository';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';
import { OrderService } from '@/application/services/order.service';
import { TimelineEventFactory } from '@/domain/factories/timeline-event.factory';

export interface PlaceOrderInput {
  orderId: string;
  userId: string;
  correlationId: string;
}

export interface PlaceOrderOutput {
  orderId: string;
  userId: string;
  status: string;
  shouldScheduleProcessing: boolean;
}

export class PlaceOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly orderService: OrderService
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
    const order = await this.orderService.findOrThrow(input.orderId);

    if (order.status === 'PLACED' || order.status === 'PROCESSING') {
      return {
        orderId: order.orderId,
        userId: input.userId,
        status: order.status,
        shouldScheduleProcessing: false,
      };
    }

    const previousStatus = order.status;
    order.status = 'PROCESSING';
    order.updatedAt = new Date().toISOString();

    await this.orderRepository.save(order);

    const orderPlacedEvent = TimelineEventFactory.create({
      orderId: order.orderId,
      userId: input.userId,
      type: 'ORDER_PLACED',
      correlationId: input.correlationId,
      payload: {
        acceptedAt: order.updatedAt,
        status: order.status,
      },
    });

    const statusChangedEvent = TimelineEventFactory.create({
      orderId: order.orderId,
      userId: input.userId,
      type: 'ORDER_STATUS_CHANGED',
      correlationId: input.correlationId,
      payload: {
        from: previousStatus,
        to: order.status,
      },
    });

    await this.timelineRepository.save(orderPlacedEvent);
    await this.timelineRepository.save(statusChangedEvent);

    return {
      orderId: order.orderId,
      userId: input.userId,
      status: order.status,
      shouldScheduleProcessing: true,
    };
  }
}
