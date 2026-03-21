import { Order, OrderItem } from '@/domain/entities/order.entity';
import { Money } from '@/domain/value-objects/money.vo';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { randomUUID } from 'crypto';
import { PricingService } from '@/domain/services/pricing.service';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';
import { DynamoMenuRepository } from '@/infrastructure/repositories/dynamo-menu.repository';

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
    private readonly menuRepository: DynamoMenuRepository
  ) { }

  async execute(input: UpdateItemInCartInput): Promise<UpdateItemInCartOutput> {
    // 1. Validate order exists
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // 2. Find existing item in cart
    const existingItemIndex = order.items.findIndex(
      (item) => item.productId === input.productId
    );

    if (existingItemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    // 3. Get product from DB (source of truth)
    const product = await this.menuRepository.findById(input.productId);

    if (!product) {
      throw new Error('Product not found');
    }

    // 4. Validate modifiers if product has them
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

      // Validate protein (required exactly 1)
      if (product.modifiers.protein?.required) {
        const protein = grouped['protein'] || [];

        if (protein.length !== 1) {
          throw new Error('Protein is required and must be exactly 1');
        }

        const validOptions = product.modifiers.protein.options;

        if (!validOptions.includes(protein[0].optionId)) {
          throw new Error('Invalid protein option');
        }
      }

      // Validate toppings
      if (product.modifiers.toppings) {
        const toppings = grouped['toppings'] || [];

        if (
          product.modifiers.toppings.max &&
          toppings.length > product.modifiers.toppings.max
        ) {
          throw new Error('Too many toppings selected');
        }

        const validOptions = product.modifiers.toppings.options;

        for (const t of toppings) {
          if (!validOptions.includes(t.optionId)) {
            throw new Error('Invalid topping option');
          }
        }
      }

      // Validate sauces
      if (product.modifiers.sauces) {
        const sauces = grouped['sauces'] || [];

        if (
          product.modifiers.sauces.max &&
          sauces.length > product.modifiers.sauces.max
        ) {
          throw new Error('Too many sauces selected');
        }

        const validOptions = product.modifiers.sauces.options;

        for (const s of sauces) {
          if (!validOptions.includes(s.optionId)) {
            throw new Error('Invalid sauce option');
          }
        }
      }
    }

    const basePrice = new Money(product.basePrice);

    // Convert modifiers to domain objects
    const modifiers = (input.modifiers || []).map((mod) => ({
      groupId: mod.groupId,
      optionId: mod.optionId,
      name: mod.name,
      price: new Money(mod.price),
    }));

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
