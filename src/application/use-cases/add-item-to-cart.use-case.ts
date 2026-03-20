import { Order, OrderItem } from '@/domain/entities/order.entity';
import { Money } from '@/domain/value-objects/money.vo';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { randomUUID } from 'crypto';
/**
 * Input: data coming from outside (API/UI), not validated by domain yet.
 */
export interface AddItemToCartInput {
  orderId: string;
  userId: string;
  productId: string;
  name: string;
  basePrice: number;
  quantity: number;
}

/**
 * Output: result of the use case, already mapped to domain objects.
 */
export interface AddItemToCartOutput {
  order: Order;
  event: TimelineEvent;
}

export class AddItemToCartUseCase {
  execute(input: AddItemToCartInput): AddItemToCartOutput {
    // Convert external primitive to domain value object (applies domain rules)
    const basePrice = new Money(input.basePrice);

    const item: OrderItem = {
      productId: input.productId,
      name: input.name,
      basePrice,
      quantity: input.quantity,
      modifiers: [],
    };

    const order: Order = {
      orderId: input.orderId,
      userId: input.userId,
      status: 'CREATED',
      items: [item],
      pricing: {
        subtotal: basePrice.multiply(input.quantity),
        tax: new Money(0),
        serviceFee: new Money(0),
        total: basePrice.multiply(input.quantity),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const event: TimelineEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: input.orderId,
      userId: input.userId,
      type: 'CART_ITEM_ADDED',
      source: 'api',
      correlationId: randomUUID(),
      payload: {
        productId: input.productId,
        quantity: input.quantity,
      },
    };

    return { order, event };
  }
}