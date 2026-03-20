import { OrderItem } from '@/domain/entities/order.entity';
import { Money } from '@/domain/value-objects/money.vo';

export class PricingService {
  calculateSubtotal(items: OrderItem[]): Money {
    return items.reduce(
      (acc, item) => acc.add(item.basePrice.multiply(item.quantity)),
      new Money(0)
    );
  }

  calculateTotal(subtotal: Money): Money {
    // For now: no tax or service fee
    return subtotal;
  }
}