import { Order, OrderItem } from '@/domain/entities/order.entity';
import { Money } from '@/domain/value-objects/money.vo';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { randomUUID } from 'crypto';
import { PricingService } from '@/domain/services/pricing.service';


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
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly pricingService: PricingService
  ) {}

  async execute(input: AddItemToCartInput): Promise<AddItemToCartOutput> {
    // Convert external primitive to domain value object (applies domain rules)
    const basePrice = new Money(input.basePrice);

    const newItem: OrderItem = {
      productId: input.productId,
      name: input.name,
      basePrice,
      quantity: input.quantity,
      modifiers: [],
    };

    let order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      order = {
        orderId: input.orderId,
        userId: input.userId,
        status: 'CREATED',
        items: [],
        pricing: {
          subtotal: new Money(0),
          tax: new Money(0),
          serviceFee: new Money(0),
          total: new Money(0),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Add item to order
    order.items.push(newItem);

    // Recalculate pricing
    const subtotal = this.pricingService.calculateSubtotal(order.items);
    const total = this.pricingService.calculateTotal(subtotal);

    order.pricing = {
      subtotal,
      tax: new Money(0),
      serviceFee: new Money(0),
      total,
    };

    order.updatedAt = new Date().toISOString();

    await this.orderRepository.save(order);

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

    // Return the order (cart) with the new item and the event that registers the action
    return { order, event };
  }
}