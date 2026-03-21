import { randomUUID } from 'crypto';

import { Order } from '@/domain/entities/order.entity';
import { TimelineEvent } from '@/domain/entities/timeline-event.entity';
import { PricingService } from '@/domain/services/pricing.service';

export interface RecalculateOrderPricingInput {
  order: Order;
  orderId: string;
  userId: string;
  correlationId: string;
}

export class OrderPricingService {
  constructor(private readonly pricingService: PricingService) {}

  recalculate(input: RecalculateOrderPricingInput): TimelineEvent {
    const { order, orderId, userId, correlationId } = input;
    const subtotal = this.pricingService.calculateSubtotal(order.items);
    const tax = this.pricingService.calculateTax(subtotal);
    const serviceFee = this.pricingService.calculateServiceFee(subtotal);
    const total = this.pricingService.calculateTotal(subtotal);

    order.pricing = {
      subtotal,
      tax,
      serviceFee,
      total,
    };

    order.updatedAt = new Date().toISOString();

    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId,
      userId,
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
  }
}
