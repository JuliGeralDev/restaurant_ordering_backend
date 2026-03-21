import { OrderRepository } from '@/domain/repositories/order.repository';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { OrderPricingService } from '@/application/services/order-pricing.service';
import { Order } from '@/domain/entities/order.entity';
import { NotFoundError } from '@/domain/errors/not-found.error';
import { randomUUID } from 'crypto';

export interface RemoveItemInput {
  orderId: string;
  userId: string;
  productId: string;
}

export interface RemoveItemOutput {
  order: Order;
}

export class RemoveItemFromCartUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly orderPricingService: OrderPricingService
  ) { }

  async execute(input: RemoveItemInput): Promise<RemoveItemOutput> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const existingItem = order.items.find(
      (item) => item.productId === input.productId
    );

    if (!existingItem) {
      throw new NotFoundError('Item not found in cart');
    }

    const correlationId = randomUUID();

    //  Remove item
    order.items = order.items.filter(
      (item) => item.productId !== input.productId
    );

    //  Recalculate pricing
    const pricingEvent = this.orderPricingService.recalculate({
      order,
      orderId: input.orderId,
      userId: input.userId,
      correlationId,
    });

    await this.orderRepository.save(order);

    //  Event: item removed
    const removeEvent: TimelineEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: input.orderId,
      userId: input.userId,
      type: 'CART_ITEM_REMOVED',
      source: 'api',
      correlationId,
      payload: {
        productId: input.productId,
      },
    };

    await this.timelineRepository.save(removeEvent);

    //  Event: pricing recalculated
    await this.timelineRepository.save(pricingEvent);

    return {
      order,
    };
  }
}
