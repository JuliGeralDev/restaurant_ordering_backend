import { Order, OrderItem } from '@/domain/entities/order.entity';
import { Money } from '@/domain/value-objects/money.vo';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { randomUUID } from 'crypto';
import { PricingService } from '@/domain/services/pricing.service';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';

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
    private readonly pricingService: PricingService,
    private readonly timelineRepository: TimelineRepository
  ) { }

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
    const correlationId = randomUUID();
    let isNewOrder = false;

    if (!order) {
      isNewOrder = true;
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

      // Register order creation event
      const orderCreatedEvent: TimelineEvent = {
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        orderId: input.orderId,
        userId: input.userId,
        type: 'ORDER_STATUS_CHANGED',
        source: 'api',
        correlationId,
        payload: {
          status: 'CREATED',
          previousStatus: null,
        },
      };
      await this.timelineRepository.save(orderCreatedEvent);
    }

    // Add item to order
    let eventType: 'CART_ITEM_ADDED' | 'CART_ITEM_UPDATED';

    const existingItem = order.items.find(
      (item) => item.productId === newItem.productId
    );

    if (existingItem) {
      existingItem.quantity += newItem.quantity;
      eventType = 'CART_ITEM_UPDATED';
    } else {
      order.items.push(newItem);
      eventType = 'CART_ITEM_ADDED';
    }

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

    // Register item event
    const itemEvent: TimelineEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: input.orderId,
      userId: input.userId,
      type: eventType,
      source: 'api',
      correlationId,
      payload: {
        productId: input.productId,
        name: input.name,
        quantity: input.quantity,
        basePrice: input.basePrice,
      },
    };
    await this.timelineRepository.save(itemEvent);

    // Register pricing recalculation event
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

    // Return the order (cart) with the new item and the last event
    return { order, event: itemEvent };
  }
}