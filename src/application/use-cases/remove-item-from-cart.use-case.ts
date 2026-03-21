import { Order } from '@/domain/entities/order.entity';
import { randomUUID } from 'crypto';
import { OrderService } from '@/application/services/order.service';
import { CartOperationOrchestrator } from '@/application/services/cart-operation.orchestrator';

export interface RemoveItemInput {
  orderId: string;
  userId: string;
  productId: string;
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
    
    this.orderService.findItemOrThrow(order, input.productId);

    order.items = order.items.filter((item) => item.productId !== input.productId);

    const correlationId = randomUUID();

    await this.cartOrchestrator.saveCartOperation({
      order,
      orderId: input.orderId,
      userId: input.userId,
      correlationId,
      eventType: 'CART_ITEM_REMOVED',
      eventPayload: {
        productId: input.productId,
      },
    });

    return {
      order,
    };
  }
}
