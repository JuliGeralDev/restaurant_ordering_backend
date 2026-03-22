import { OrderService } from '@/application/services/order.service';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { Order } from '@/domain/entities/order.entity';
import { Money } from '@/domain/value-objects/money.vo';
import { NotFoundError } from '@/domain/errors/not-found.error';

describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    mockOrderRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    orderService = new OrderService(mockOrderRepository);
  });

  describe('findOrThrow', () => {
    it('should return order when found', async () => {
      const mockOrder: Order = {
        orderId: 'order-123',
        userId: 'user-456',
        status: 'CREATED',
        items: [],
        pricing: {
          subtotal: new Money(0),
          tax: new Money(0),
          serviceFee: new Money(0),
          total: new Money(0),
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const result = await orderService.findOrThrow('order-123');

      expect(result).toBe(mockOrder);
      expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-123');
      expect(mockOrderRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when order not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(orderService.findOrThrow('order-123')).rejects.toThrow(NotFoundError);
      await expect(orderService.findOrThrow('order-123')).rejects.toThrow('Order not found');
    });
  });

  describe('createNew', () => {
    it('should create a new order with default values', () => {
      const order = orderService.createNew('order-123', 'user-456');

      expect(order.orderId).toBe('order-123');
      expect(order.userId).toBe('user-456');
      expect(order.status).toBe('CREATED');
      expect(order.items).toEqual([]);
      expect(order.pricing.subtotal.value).toBe(0);
      expect(order.pricing.tax.value).toBe(0);
      expect(order.pricing.serviceFee.value).toBe(0);
      expect(order.pricing.total.value).toBe(0);
      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
    });

    it('should create order with valid ISO 8601 timestamps', () => {
      const order = orderService.createNew('order-123', 'user-456');

      expect(new Date(order.createdAt).toISOString()).toBe(order.createdAt);
      expect(new Date(order.updatedAt).toISOString()).toBe(order.updatedAt);
    });

    it('should create different orders with different IDs', () => {
      const order1 = orderService.createNew('order-1', 'user-1');
      const order2 = orderService.createNew('order-2', 'user-2');

      expect(order1.orderId).not.toBe(order2.orderId);
      expect(order1.userId).not.toBe(order2.userId);
    });
  });

  describe('findItemOrThrow', () => {
    const mockOrder: Order = {
      orderId: 'order-123',
      userId: 'user-456',
      status: 'CREATED',
      items: [
        {
          cartItemId: 'cart-item-1',
          productId: 'prod-1',
          name: 'Burger',
          basePrice: new Money(10000),
          quantity: 2,
          modifiers: [],
        },
        {
          cartItemId: 'cart-item-2',
          productId: 'prod-2',
          name: 'Fries',
          basePrice: new Money(5000),
          quantity: 1,
          modifiers: [],
        },
      ],
      pricing: {
        subtotal: new Money(0),
        tax: new Money(0),
        serviceFee: new Money(0),
        total: new Money(0),
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should return item when found', () => {
      const item = orderService.findItemOrThrow(mockOrder, 'prod-1');

      expect(item.productId).toBe('prod-1');
      expect(item.name).toBe('Burger');
      expect(item.quantity).toBe(2);
    });

    it('should throw NotFoundError when item not found', () => {
      expect(() => orderService.findItemOrThrow(mockOrder, 'prod-999')).toThrow(NotFoundError);
      expect(() => orderService.findItemOrThrow(mockOrder, 'prod-999')).toThrow('Item not found in cart');
    });

    it('should find second item in list', () => {
      const item = orderService.findItemOrThrow(mockOrder, 'prod-2');

      expect(item.productId).toBe('prod-2');
      expect(item.name).toBe('Fries');
    });
  });

  describe('hasItem', () => {
    const mockOrder: Order = {
      orderId: 'order-123',
      userId: 'user-456',
      status: 'CREATED',
      items: [
        {
          cartItemId: 'cart-item-3',
          productId: 'prod-1',
          name: 'Burger',
          basePrice: new Money(10000),
          quantity: 2,
          modifiers: [],
        },
      ],
      pricing: {
        subtotal: new Money(0),
        tax: new Money(0),
        serviceFee: new Money(0),
        total: new Money(0),
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should return true when item exists', () => {
      const result = orderService.hasItem(mockOrder, 'prod-1');
      expect(result).toBe(true);
    });

    it('should return false when item does not exist', () => {
      const result = orderService.hasItem(mockOrder, 'prod-999');
      expect(result).toBe(false);
    });

    it('should return false for empty items array', () => {
      const emptyOrder = { ...mockOrder, items: [] };
      const result = orderService.hasItem(emptyOrder, 'prod-1');
      expect(result).toBe(false);
    });
  });

  describe('findItemByCartItemIdOrThrow', () => {
    const mockOrder: Order = {
      orderId: 'order-123',
      userId: 'user-456',
      status: 'CREATED',
      items: [
        {
          cartItemId: 'cart-item-10',
          productId: 'prod-1',
          name: 'Burger',
          basePrice: new Money(10000),
          quantity: 2,
          modifiers: [],
        },
        {
          cartItemId: 'cart-item-11',
          productId: 'prod-1',
          name: 'Burger',
          basePrice: new Money(10000),
          quantity: 1,
          modifiers: [
            { groupId: 'sauce', optionId: 'ketchup', name: 'Ketchup', price: new Money(50) },
          ],
        },
      ],
      pricing: {
        subtotal: new Money(0),
        tax: new Money(0),
        serviceFee: new Money(0),
        total: new Money(0),
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should return item when found by cartItemId', () => {
      const item = orderService.findItemByCartItemIdOrThrow(mockOrder, 'cart-item-10');

      expect(item.cartItemId).toBe('cart-item-10');
      expect(item.productId).toBe('prod-1');
      expect(item.quantity).toBe(2);
    });

    it('should return correct item when multiple items with same productId exist', () => {
      const item = orderService.findItemByCartItemIdOrThrow(mockOrder, 'cart-item-11');

      expect(item.cartItemId).toBe('cart-item-11');
      expect(item.quantity).toBe(1);
      expect(item.modifiers.length).toBe(1);
    });

    it('should throw NotFoundError when cartItemId not found', () => {
      expect(() => orderService.findItemByCartItemIdOrThrow(mockOrder, 'cart-item-999')).toThrow(NotFoundError);
      expect(() => orderService.findItemByCartItemIdOrThrow(mockOrder, 'cart-item-999')).toThrow('Cart item not found');
    });
  });
});
