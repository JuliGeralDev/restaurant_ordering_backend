import { Order } from '@/domain/entities/order.entity';
import { randomUUID } from 'crypto';
import { OrderService } from '@/application/services/order.service';
import { CartOperationOrchestrator } from '@/application/services/cart-operation.orchestrator';

export interface RemoveItemInput {
  orderId: string;
  userId: string;
  cartItemId: string; // Unique identifier for the specific cart item instance
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
    
    this.orderService.findItemByCartItemIdOrThrow(order, input.cartItemId);

    order.items = order.items.filter((item) => item.cartItemId !== input.cartItemId);

    const correlationId = randomUUID();

    await this.cartOrchestrator.saveCartOperation({
      order,
      orderId: input.orderId,
      userId: input.userId,
      correlationId,
      eventType: 'CART_ITEM_REMOVED',
      eventPayload: {
        cartItemId: input.cartItemId,
      },
    });

    return {
      order,
    };
  }
}
