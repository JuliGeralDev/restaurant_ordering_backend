import { Order, OrderItem } from '@/domain/entities/order.entity';
import { Money } from '@/domain/value-objects/money.vo';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { randomUUID } from 'crypto';
import { OrderPricingService } from '@/application/services/order-pricing.service';
import {
  ModifierSelectionInput,
  ModifierSelectionService,
} from '@/domain/services/modifier-selection.service';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';
import { MenuRepository } from '@/domain/repositories/menu.repository';
import { NotFoundError } from '@/domain/errors/not-found.error';

/**
 * Input: data coming from outside (API/UI)
 * Only trusted field is productId, everything else is validated/derived
 */
export interface AddItemToCartInput {
  orderId?: string; // Opcional - backend genera si no viene
  userId: string;
  productId: string;
  quantity: number;
  modifiers?: ModifierSelectionInput[];
}

/**
 * Output: domain result after operation
 */
export interface AddItemToCartOutput {
  order: Order;
  event: TimelineEvent;
}

export class AddItemToCartUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderPricingService: OrderPricingService,
    private readonly timelineRepository: TimelineRepository,
    private readonly menuRepository: MenuRepository,
    private readonly modifierSelectionService: ModifierSelectionService
  ) { }

  async execute(input: AddItemToCartInput): Promise<AddItemToCartOutput> {
    // 0. Generate orderId if not provided
    const orderId = input.orderId || this.generateOrderId(input.userId);

    // 1. Get product from DB (source of truth)
    const product = await this.menuRepository.findById(input.productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const basePrice = new Money(product.basePrice);
    const modifiers = this.modifierSelectionService.resolve(product, input.modifiers);

    const newItem: OrderItem = {
      productId: product.productId,
      name: product.name,
      basePrice,
      quantity: input.quantity,
      modifiers,
    };

    let order = await this.orderRepository.findById(orderId);
    const correlationId = randomUUID();
    let isNewOrder = false;

    //  2. Create order if not exists
    if (!order) {
      isNewOrder = true;

      order = {
        orderId: orderId,
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

      const orderCreatedEvent: TimelineEvent = {
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        orderId: orderId,
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

    //  3. Add or update item
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

    //  4. Recalculate pricing
    const pricingEvent = this.orderPricingService.recalculate({
      order,
      orderId,
      userId: input.userId,
      correlationId,
    });

    await this.orderRepository.save(order);

    //  5. Item event
    const itemEvent: TimelineEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: orderId,
      userId: input.userId,
      type: eventType,
      source: 'api',
      correlationId,
      payload: {
        productId: product.productId,
        name: product.name,
        quantity: input.quantity,
        basePrice: product.basePrice,
      },
    };

    await this.timelineRepository.save(itemEvent);

    // 6. Pricing event
    await this.timelineRepository.save(pricingEvent);

    return {
      order,
      event: itemEvent,
    };
  }

  /**
   * Generates a unique orderId
   * Format: ord_{userId}_{timestamp}_{random6}
   */
  private generateOrderId(userId: string): string {
    const timestamp = Date.now();
    const random = randomUUID().slice(0, 6);
    return `ord_${userId}_${timestamp}_${random}`;
  }
}
