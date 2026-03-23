import { Money } from '../value-objects/money.vo';

export type OrderStatus = 'CREATED' | 'PROCESSING' | 'PLACED';

export interface OrderItemModifier {
  groupId: string;
  optionId: string;
  name: string;
  price: Money;
}

export interface OrderItem {
  cartItemId: string; // Unique identifier for this cart item instance
  productId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice: Money;
  quantity: number;
  modifiers: OrderItemModifier[];
}

export interface OrderPricing {
  subtotal: Money;
  tax: Money;
  serviceFee: Money;
  total: Money;
}

export interface Order {
  orderId: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  pricing: OrderPricing;
  createdAt: string;
  updatedAt: string;
}
