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
 * Input: data for updating an existing cart item
 */
export interface UpdateItemInCartInput {
  orderId: string;
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
 * Output: updated order after modification
 */
export interface UpdateItemInCartOutput {
  order: Order;
  event: TimelineEvent;
}

export class UpdateItemInCartUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly pricingService: PricingService,
    private readonly timelineRepository: TimelineRepository,
    private readonly menuRepository: MenuRepository
  ) { }

  async execute(input: UpdateItemInCartInput): Promise<UpdateItemInCartOutput> {
    // 1. Validate order exists
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // 2. Check if item exists
    const existingItemIndex = order.items.findIndex(
      (item) => item.productId === input.productId
    );

    if (existingItemIndex === -1) {
      throw new NotFoundError('Item not found in cart');
    }

    // 3. Get product from DB (source of truth)
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

    // 5. Update item in cart
    const updatedItem: OrderItem = {
      productId: product.productId,
      name: product.name,
      basePrice,
      quantity: input.quantity,
      modifiers,
    };

    order.items[existingItemIndex] = updatedItem;

    // 6. Recalculate pricing
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

    const correlationId = randomUUID();

    // 7. Create CART_ITEM_UPDATED event
    const itemEvent: TimelineEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: input.orderId,
      userId: input.userId,
      type: 'CART_ITEM_UPDATED',
      source: 'api',
      correlationId,
      payload: {
        productId: product.productId,
        name: product.name,
        quantity: input.quantity,
        basePrice: product.basePrice,
        modifiersCount: modifiers.length,
      },
    };

    await this.timelineRepository.save(itemEvent);

    // 8. Create PRICING_CALCULATED event
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
        tax: tax.value,
        serviceFee: serviceFee.value,
        total: total.value,
      },
    };

    await this.timelineRepository.save(pricingEvent);

    return {
      order,
      event: itemEvent,
    };
  }
}
