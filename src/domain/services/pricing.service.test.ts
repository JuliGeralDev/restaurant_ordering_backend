import { PricingService } from '@/domain/services/pricing.service';
import { Money } from '@/domain/value-objects/money.vo';
import { OrderItem } from '@/domain/entities/order.entity';

describe('PricingService', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal for single item without modifiers', () => {
      const items: OrderItem[] = [
        {
          cartItemId: 'cart-1',
          productId: '1',
          name: 'Burger',
          basePrice: new Money(10000),
          quantity: 2,
          modifiers: [],
        },
      ];

      const result = pricingService.calculateSubtotal(items);
      expect(result.value).toBe(20000);
    });

    it('should calculate subtotal for item with modifiers', () => {
      const items: OrderItem[] = [
        {
          cartItemId: 'cart-2',
          productId: '1',
          name: 'Burger',
          basePrice: new Money(10000),
          quantity: 2,
          modifiers: [
            {
              groupId: 'toppings',
              optionId: 'cheese',
              name: 'Cheese',
              price: new Money(500),
            },
          ],
        },
      ];

      // (10000 + 500) * 2 = 21000
      const result = pricingService.calculateSubtotal(items);
      expect(result.value).toBe(21000);
    });

    it('should calculate subtotal for multiple items', () => {
      const items: OrderItem[] = [
        {
          cartItemId: 'cart-3',
          productId: '1',
          name: 'Burger',
          basePrice: new Money(10000),
          quantity: 2,
          modifiers: [],
        },
        {
          cartItemId: 'cart-4',
          productId: '2',
          name: 'Fries',
          basePrice: new Money(5000),
          quantity: 1,
          modifiers: [],
        },
      ];

      // (10000 * 2) + (5000 * 1) = 25000
      const result = pricingService.calculateSubtotal(items);
      expect(result.value).toBe(25000);
    });

    it('should return zero for empty items array', () => {
      const result = pricingService.calculateSubtotal([]);
      expect(result.value).toBe(0);
    });

    it('should calculate subtotal with multiple modifiers', () => {
      const items: OrderItem[] = [
        {
          cartItemId: 'cart-5',
          productId: '1',
          name: 'Custom Burger',
          basePrice: new Money(10000),
          quantity: 1,
          modifiers: [
            {
              groupId: 'toppings',
              optionId: 'cheese',
              name: 'Cheese',
              price: new Money(500),
            },
            {
              groupId: 'toppings',
              optionId: 'bacon',
              name: 'Bacon',
              price: new Money(900),
            },
          ],
        },
      ];

      // 10000 + 500 + 900 = 11400
      const result = pricingService.calculateSubtotal(items);
      expect(result.value).toBe(11400);
    });
  });

  describe('calculateTax', () => {
    it('should calculate 10% tax correctly', () => {
      const subtotal = new Money(10000);
      const result = pricingService.calculateTax(subtotal);
      
      // 10% of 10000 = 1000
      expect(result.value).toBe(1000);
    });

    it('should round tax amount', () => {
      const subtotal = new Money(10555);
      const result = pricingService.calculateTax(subtotal);
      
      // 10% of 10555 = 1055.5 → rounded to 1056
      expect(result.value).toBe(1056);
    });

    it('should return zero tax for zero subtotal', () => {
      const subtotal = new Money(0);
      const result = pricingService.calculateTax(subtotal);
      
      expect(result.value).toBe(0);
    });
  });

  describe('calculateServiceFee', () => {
    it('should calculate 5% service fee correctly', () => {
      const subtotal = new Money(10000);
      const result = pricingService.calculateServiceFee(subtotal);
      
      // 5% of 10000 = 500
      expect(result.value).toBe(500);
    });

    it('should round service fee amount', () => {
      const subtotal = new Money(10333);
      const result = pricingService.calculateServiceFee(subtotal);
      
      // 5% of 10333 = 516.65 → rounded to 517
      expect(result.value).toBe(517);
    });

    it('should return zero fee for zero subtotal', () => {
      const subtotal = new Money(0);
      const result = pricingService.calculateServiceFee(subtotal);
      
      expect(result.value).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total with tax and service fee', () => {
      const subtotal = new Money(10000);
      const result = pricingService.calculateTotal(subtotal);
      
      // subtotal: 10000
      // tax (10%): 1000
      // fee (5%): 500
      // total: 11500
      expect(result.value).toBe(11500);
    });

    it('should handle zero subtotal', () => {
      const subtotal = new Money(0);
      const result = pricingService.calculateTotal(subtotal);
      
      expect(result.value).toBe(0);
    });

    it('should calculate correctly for large amounts', () => {
      const subtotal = new Money(100000);
      const result = pricingService.calculateTotal(subtotal);
      
      // subtotal: 100000
      // tax (10%): 10000
      // fee (5%): 5000
      // total: 115000
      expect(result.value).toBe(115000);
    });
  });
});
