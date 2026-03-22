import { Order } from '@/domain/entities/order.entity';
import { randomUUID } from 'crypto';
import { OrderService } from '@/application/services/order.service';
import { CartOperationOrchestrator } from '@/application/services/cart-operation.orchestrator';

export interface RemoveItemInput {
  orderId: string;
  userId: string;
  cartItemId?: string; // Remove specific instance (decrement or delete)
  productId?: string;  // Remove ALL instances of this product
}

export interface RemoveItemOutput {
  order: Order;
}

export class RemoveItemFromCartUseCase {
  constructor(
    private readonly orderService: OrderService,
    private readonly cartOrchestrator: CartOperationOrchestrator
  ) {}

  async execute(input: RemoveItemInput): Promise<RemoveItemOutput> {
    const order = await this.orderService.findOrThrow(input.orderId);

    const correlationId = randomUUID();
    let eventType: 'CART_ITEM_REMOVED' | 'CART_ITEM_UPDATED';
    let eventPayload: Record<string, unknown>;

    if (input.productId && !input.cartItemId) {
      // Remove ALL instances of this product
      const removedCount = order.items.filter((i) => i.productId === input.productId).length;

      if (removedCount === 0) {
        throw new (await import('@/domain/errors/not-found.error')).NotFoundError(
          'No items found for this product in the cart'
        );
      }

      order.items = order.items.filter((i) => i.productId !== input.productId);
      eventType = 'CART_ITEM_REMOVED';
      eventPayload = { productId: input.productId, removedCount };
    } else {
      // Remove or decrement a specific cart item instance
      const item = this.orderService.findItemByCartItemIdOrThrow(order, input.cartItemId!);

      if (item.quantity > 1) {
        item.quantity -= 1;
        eventType = 'CART_ITEM_UPDATED';
        eventPayload = { cartItemId: input.cartItemId, remainingQuantity: item.quantity };
      } else {
        order.items = order.items.filter((i) => i.cartItemId !== input.cartItemId);
        eventType = 'CART_ITEM_REMOVED';
        eventPayload = { cartItemId: input.cartItemId, remainingQuantity: 0 };
      }
    }

    await this.cartOrchestrator.saveCartOperation({
      order,
      orderId: input.orderId,
      userId: input.userId,
      correlationId,
      eventType,
      eventPayload,
    });

    return { order };
  }
}
