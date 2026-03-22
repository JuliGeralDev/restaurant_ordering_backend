import { Order, OrderItem } from '@/domain/entities/order.entity';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { NotFoundError } from '@/domain/errors/not-found.error';
import { Money } from '@/domain/value-objects/money.vo';

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async findOrThrow(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    return order;
  }

  createNew(orderId: string, userId: string): Order {
    return {
      orderId,
      userId,
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

  findItemOrThrow(order: Order, productId: string): OrderItem {
    const item = order.items.find((i) => i.productId === productId);
    if (!item) {
      throw new NotFoundError('Item not found in cart');
    }
    return item;
  }

  findItemByCartItemIdOrThrow(order: Order, cartItemId: string): OrderItem {
    const item = order.items.find((i) => i.cartItemId === cartItemId);
    if (!item) {
      throw new NotFoundError('Cart item not found');
    }
    return item;
  }

  hasItem(order: Order, productId: string): boolean {
    return order.items.some((i) => i.productId === productId);
  }
}
