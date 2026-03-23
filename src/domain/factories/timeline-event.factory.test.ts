import { TimelineEventFactory } from '@/domain/factories/timeline-event.factory';

describe('TimelineEventFactory', () => {
  describe('create', () => {
    it('should create a valid timeline event with all required fields', () => {
      const params = {
        orderId: 'order-123',
        userId: 'user-456',
        type: 'CART_ITEM_ADDED' as const,
        correlationId: 'corr-789',
        payload: {
          productId: 'prod-1',
          quantity: 2,
        },
      };

      const event = TimelineEventFactory.create(params);

      expect(event.orderId).toBe('order-123');
      expect(event.userId).toBe('user-456');
      expect(event.type).toBe('CART_ITEM_ADDED');
      expect(event.correlationId).toBe('corr-789');
      expect(event.payload).toEqual({ productId: 'prod-1', quantity: 2 });
      expect(event.source).toBe('api');
    });

    it('should generate unique eventId for each call', () => {
      const params = {
        orderId: 'order-123',
        userId: 'user-456',
        type: 'CART_ITEM_ADDED' as const,
        correlationId: 'corr-789',
        payload: {},
      };

      const event1 = TimelineEventFactory.create(params);
      const event2 = TimelineEventFactory.create(params);

      expect(event1.eventId).toBeDefined();
      expect(event2.eventId).toBeDefined();
      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should generate valid UUID for eventId', () => {
      const params = {
        orderId: 'order-123',
        userId: 'user-456',
        type: 'ORDER_PLACED' as const,
        correlationId: 'corr-789',
        payload: {},
      };

      const event = TimelineEventFactory.create(params);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(event.eventId).toMatch(uuidRegex);
    });

    it('should set timestamp as ISO 8601 format', () => {
      const params = {
        orderId: 'order-123',
        userId: 'user-456',
        type: 'ORDER_PLACED' as const,
        correlationId: 'corr-789',
        payload: {},
      };

      const event = TimelineEventFactory.create(params);

      expect(event.timestamp).toBeDefined();
      expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
    });

    it('should create events for all event types', () => {
      const eventTypes = [
        'CART_ITEM_ADDED',
        'CART_ITEM_UPDATED',
        'CART_ITEM_REMOVED',
        'PRICING_CALCULATED',
        'ORDER_PLACED',
        'ORDER_STATUS_CHANGED',
        'VALIDATION_FAILED',
      ] as const;

      eventTypes.forEach((type) => {
        const event = TimelineEventFactory.create({
          orderId: 'order-123',
          userId: 'user-456',
          type,
          correlationId: 'corr-789',
          payload: {},
        });

        expect(event.type).toBe(type);
        expect(event.source).toBe('api');
      });
    });

    it('should handle empty payload', () => {
      const params = {
        orderId: 'order-123',
        userId: 'user-456',
        type: 'ORDER_PLACED' as const,
        correlationId: 'corr-789',
        payload: {},
      };

      const event = TimelineEventFactory.create(params);

      expect(event.payload).toEqual({});
    });

    it('should handle complex nested payload', () => {
      const complexPayload = {
        productId: 'prod-1',
        name: 'Custom Burger',
        quantity: 2,
        modifiers: [
          { groupId: 'protein', optionId: 'beef', price: 0 },
          { groupId: 'toppings', optionId: 'cheese', price: 500 },
        ],
        pricing: {
          subtotal: 20000,
          tax: 2000,
        },
      };

      const params = {
        orderId: 'order-123',
        userId: 'user-456',
        type: 'CART_ITEM_ADDED' as const,
        correlationId: 'corr-789',
        payload: complexPayload,
      };

      const event = TimelineEventFactory.create(params);

      expect(event.payload).toEqual(complexPayload);
    });

    it('should always set source as api', () => {
      const params = {
        orderId: 'order-123',
        userId: 'user-456',
        type: 'ORDER_PLACED' as const,
        correlationId: 'corr-789',
        payload: {},
      };

      const event = TimelineEventFactory.create(params);

      expect(event.source).toBe('api');
    });

    it('should allow overriding source for worker-originated events', () => {
      const event = TimelineEventFactory.create({
        orderId: 'order-123',
        userId: 'user-456',
        type: 'ORDER_STATUS_CHANGED',
        correlationId: 'corr-789',
        source: 'worker',
        payload: {
          from: 'PROCESSING',
          to: 'PLACED',
        },
      });

      expect(event.source).toBe('worker');
    });
  });
});
