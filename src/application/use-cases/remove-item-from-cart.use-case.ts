import { OrderRepository } from '@/domain/repositories/order.repository';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { PricingService } from '@/domain/services/pricing.service';
import { Money } from '@/domain/value-objects/money.vo';
import { Order } from '@/domain/entities/order.entity';
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
    private readonly pricingService: PricingService
  ) { }

  async execute(input: RemoveItemInput): Promise<RemoveItemOutput> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    const existingItem = order.items.find(
      (item) => item.productId === input.productId
    );

    if (!existingItem) {
      throw new Error('Item not found in cart');
    }

    const correlationId = randomUUID();

    //  Remove item
    order.items = order.items.filter(
      (item) => item.productId !== input.productId
    );

    //  Recalculate pricing
    const subtotal = this.pricingService.calculateSubtotal(order.items);
    const total = this.pricingService.calculateTotal(subtotal);

    const tax = this.pricingService.calculateTax(subtotal);
    const serviceFee = this.pricingService.calculateServiceFee(subtotal);

    order.pricing = {
      subtotal,
      tax,
      serviceFee,
      total,
    };

    order.updatedAt = new Date().toISOString();

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
    const pricingEvent: TimelineEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: input.orderId,
      userId: input.userId,
      type: 'PRICING_CALCULATED',
      source: 'api',
      correlationId,
      payload: {
        subtotal: subtotal.value,
        tax: 0,
        serviceFee: 0,
        total: total.value,
      },
    };

    await this.timelineRepository.save(pricingEvent);

    return {
      order,
    };
  }
}