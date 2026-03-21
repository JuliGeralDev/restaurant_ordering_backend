import { Order, OrderItem } from '@/domain/entities/order.entity';
import { Money } from '@/domain/value-objects/money.vo';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { randomUUID } from 'crypto';
import { PricingService } from '@/domain/services/pricing.service';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';
import { MenuRepository } from '@/domain/repositories/menu.repository';
import { NotFoundError } from '@/domain/errors/not-found.error';
import { ValidationError } from '@/domain/errors/validation.error';

/**
 * Input: data coming from outside (API/UI)
 * Only trusted field is productId, everything else is validated/derived
 */
export interface AddItemToCartInput {
  orderId?: string; // Opcional - backend genera si no viene
  userId: string;
  productId: string;
  quantity: number;
  modifiers?: Array<{
    groupId: string;
    optionId: string;
    name: string;
    price: number;
  }>;
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
    private readonly pricingService: PricingService,
    private readonly timelineRepository: TimelineRepository,
    private readonly menuRepository: MenuRepository
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

    // Validate and build modifiers with REAL prices from DB (security: never trust client prices)
    const modifiers: Array<{
      groupId: string;
      optionId: string;
      name: string;
      price: Money;
    }> = [];

    if (product.modifiers) {
      const inputModifiers = input.modifiers || [];

      // Group modifiers by groupId
      const grouped: Record<string, any[]> = {};
      for (const mod of inputModifiers) {
        if (!grouped[mod.groupId]) {
          grouped[mod.groupId] = [];
        }
        grouped[mod.groupId].push(mod);
      }

      // Validate and extract REAL prices for each modifier group
      for (const groupId of Object.keys(product.modifiers)) {
        const groupConfig = product.modifiers[groupId];
        const userSelections = grouped[groupId] || [];

        // Check required
        if (groupConfig.required && userSelections.length === 0) {
          throw new ValidationError(`${groupId} is required`);
        }

        // Check max
        if (groupConfig.max && userSelections.length > groupConfig.max) {
          throw new ValidationError(`Too many ${groupId} selected (max: ${groupConfig.max})`);
        }

        // Validate each selection and get REAL price from DB
        for (const userMod of userSelections) {
          const optionConfig = groupConfig.options[userMod.optionId];
          
          if (!optionConfig) {
            throw new ValidationError(`Invalid ${groupId} option: ${userMod.optionId}`);
          }

          // Use REAL price from database, NEVER trust client
          modifiers.push({
            groupId: groupId,
            optionId: userMod.optionId,
            name: optionConfig.name,
            price: new Money(optionConfig.price),
          });
        }
      }
    }

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
    const pricingEvent: TimelineEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: orderId,
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
