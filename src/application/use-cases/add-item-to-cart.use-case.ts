import { Order } from '@/domain/entities/order.entity';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { randomUUID } from 'crypto';
import { ModifierSelectionInput } from '@/domain/services/modifier-selection.service';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';
import { OrderService } from '@/application/services/order.service';
import { CartItemService } from '@/application/services/cart-item.service';
import { CartOperationOrchestrator } from '@/application/services/cart-operation.orchestrator';
import { TimelineEventFactory } from '@/domain/factories/timeline-event.factory';

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
    private readonly timelineRepository: TimelineRepository,
    private readonly orderService: OrderService,
    private readonly cartItemService: CartItemService,
    private readonly cartOrchestrator: CartOperationOrchestrator
  ) {}

  async execute(input: AddItemToCartInput): Promise<AddItemToCartOutput> {
    const orderId = input.orderId || this.generateOrderId(input.userId);
    const correlationId = randomUUID();

    const newItem = await this.cartItemService.resolveProductWithModifiers(
      input.productId,
      input.quantity,
      input.modifiers
    );

    let order = await this.orderRepository.findById(orderId);

    if (!order) {
      order = this.orderService.createNew(orderId, input.userId);

      const orderCreatedEvent = TimelineEventFactory.create({
        orderId,
        userId: input.userId,
        type: 'ORDER_STATUS_CHANGED',
        correlationId,
        payload: {
          status: 'CREATED',
          previousStatus: null,
        },
      });

      await this.timelineRepository.save(orderCreatedEvent);
    }

    let eventType: 'CART_ITEM_ADDED' | 'CART_ITEM_UPDATED';
    // Check if an identical item (same product AND same modifiers) already exists
    const existingItem = order.items.find((item) => 
      this.cartItemService.areItemsIdentical(item, newItem)
    );

    if (existingItem) {
      // Same product with same modifiers - just increase quantity
      existingItem.quantity += newItem.quantity;
      eventType = 'CART_ITEM_UPDATED';
    } else {
      // Different product or different modifiers - add as new item
      order.items.push(newItem);
      eventType = 'CART_ITEM_ADDED';
    }

    await this.cartOrchestrator.saveCartOperation({
      order,
      orderId,
      userId: input.userId,
      correlationId,
      eventType,
      eventPayload: {
        productId: newItem.productId,
        name: newItem.name,
        quantity: input.quantity,
        basePrice: newItem.basePrice.value,
      },
    });

    const itemEvent = TimelineEventFactory.create({
      orderId,
      userId: input.userId,
      type: eventType,
      correlationId,
      payload: {
        productId: newItem.productId,
        name: newItem.name,
        quantity: input.quantity,
        basePrice: newItem.basePrice.value,
      },
    });

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
