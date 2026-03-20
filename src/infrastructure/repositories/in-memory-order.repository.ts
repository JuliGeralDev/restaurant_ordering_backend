import { Order } from '@/domain/entities/order.entity';
import { OrderRepository } from '@/domain/repositories/order.repository';

export class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();

  async findById(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null;
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.orderId, order);
  }
}