import { CartItemService } from './cart-item.service';
import { MenuRepository } from '@/domain/repositories/menu.repository';
import { ModifierSelectionService } from '@/domain/services/modifier-selection.service';
import { NotFoundError } from '@/domain/errors/not-found.error';
import { Money } from '@/domain/value-objects/money.vo';

describe('CartItemService', () => {
  let cartItemService: CartItemService;
  let mockMenuRepository: jest.Mocked<MenuRepository>;
  let mockModifierSelectionService: jest.Mocked<ModifierSelectionService>;

  beforeEach(() => {
    mockMenuRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<MenuRepository>;

    mockModifierSelectionService = {
      resolve: jest.fn(),
    } as unknown as jest.Mocked<ModifierSelectionService>;

    cartItemService = new CartItemService(
      mockMenuRepository,
      mockModifierSelectionService
    );
  });

  describe('resolveProductWithModifiers', () => {
    it('should resolve simple product without modifiers', async () => {
      const mockProduct = {
        productId: 'prod-1',
        name: 'Hamburguesa Clásica',
        basePrice: 1200,
        category: 'burgers',
      };

      mockMenuRepository.findById.mockResolvedValue(mockProduct);
      mockModifierSelectionService.resolve.mockReturnValue([]);

      const result = await cartItemService.resolveProductWithModifiers('prod-1', 2);

      expect(result).toMatchObject({
        productId: 'prod-1',
        name: 'Hamburguesa Clásica',
        basePrice: new Money(1200),
        quantity: 2,
        modifiers: [],
      });
      expect(result.cartItemId).toBeTruthy();

      expect(mockMenuRepository.findById).toHaveBeenCalledWith('prod-1');
      expect(mockModifierSelectionService.resolve).toHaveBeenCalledWith(mockProduct, undefined);
    });

    it('should resolve product with modifiers', async () => {
      const mockProduct = {
        productId: 'prod-8',
        name: 'Pizza Personalizada',
        basePrice: 1800,
        category: 'pizzas',
        modifiers: {
          size: {
            required: true,
            max: 1,
            options: {
              small: { name: 'Pequeña', price: 0 },
              large: { name: 'Grande', price: 400 },
            },
          },
        },
      };

      const modifiersInput = [
        { groupId: 'size', optionId: 'large', name: 'Grande', price: 400 },
      ];

      const resolvedModifiers = [
        {
          groupId: 'size',
          optionId: 'large',
          name: 'Grande',
          price: new Money(400),
        },
      ];

      mockMenuRepository.findById.mockResolvedValue(mockProduct);
      mockModifierSelectionService.resolve.mockReturnValue(resolvedModifiers);

      const result = await cartItemService.resolveProductWithModifiers(
        'prod-8',
        1,
        modifiersInput
      );

      expect(result).toMatchObject({
        productId: 'prod-8',
        name: 'Pizza Personalizada',
        basePrice: new Money(1800),
        quantity: 1,
        modifiers: resolvedModifiers,
      });
      expect(result.cartItemId).toBeTruthy();

      expect(mockMenuRepository.findById).toHaveBeenCalledWith('prod-8');
      expect(mockModifierSelectionService.resolve).toHaveBeenCalledWith(
        mockProduct,
        modifiersInput
      );
    });

    it('should throw NotFoundError when product does not exist', async () => {
      mockMenuRepository.findById.mockResolvedValue(null);

      await expect(
        cartItemService.resolveProductWithModifiers('invalid-id', 1)
      ).rejects.toThrow(NotFoundError);

      await expect(
        cartItemService.resolveProductWithModifiers('invalid-id', 1)
      ).rejects.toThrow('Product not found');
    });

    it('should handle quantity correctly', async () => {
      const mockProduct = {
        productId: 'prod-2',
        name: 'Papas Fritas',
        basePrice: 500,
        category: 'sides',
      };

      mockMenuRepository.findById.mockResolvedValue(mockProduct);
      mockModifierSelectionService.resolve.mockReturnValue([]);

      const result = await cartItemService.resolveProductWithModifiers('prod-2', 5);

      expect(result.quantity).toBe(5);
    });

    it('should create Money object with correct basePrice', async () => {
      const mockProduct = {
        productId: 'prod-3',
        name: 'Coca Cola',
        basePrice: 350,
        category: 'drinks',
      };

      mockMenuRepository.findById.mockResolvedValue(mockProduct);
      mockModifierSelectionService.resolve.mockReturnValue([]);

      const result = await cartItemService.resolveProductWithModifiers('prod-3', 1);

      expect(result.basePrice).toBeInstanceOf(Money);
      expect(result.basePrice.value).toBe(350);
    });

    it('should pass modifiers to modifierSelectionService correctly', async () => {
      const mockProduct = {
        productId: 'prod-9',
        name: 'Ensalada Build-Your-Own',
        basePrice: 1200,
        category: 'salads',
      };

      const modifiersInput = [
        { groupId: 'protein', optionId: 'chicken', name: 'Pollo', price: 200 },
        { groupId: 'dressing', optionId: 'ranch', name: 'Ranch', price: 0 },
      ];

      mockMenuRepository.findById.mockResolvedValue(mockProduct);
      mockModifierSelectionService.resolve.mockReturnValue([]);

      await cartItemService.resolveProductWithModifiers('prod-9', 1, modifiersInput);

      expect(mockModifierSelectionService.resolve).toHaveBeenCalledWith(
        mockProduct,
        modifiersInput
      );
    });

    it('should handle product with zero price', async () => {
      const mockProduct = {
        productId: 'prod-free',
        name: 'Agua Gratis',
        basePrice: 0,
        category: 'drinks',
      };

      mockMenuRepository.findById.mockResolvedValue(mockProduct);
      mockModifierSelectionService.resolve.mockReturnValue([]);

      const result = await cartItemService.resolveProductWithModifiers('prod-free', 1);

      expect(result.basePrice.value).toBe(0);
    });

    it('should not mutate input modifiers array', async () => {
      const mockProduct = {
        productId: 'prod-10',
        name: 'Test Product',
        basePrice: 1000,
        category: 'test',
      };

      const modifiersInput = [
        { groupId: 'test', optionId: 'option1', name: 'Option 1', price: 100 },
      ];
      const originalLength = modifiersInput.length;

      mockMenuRepository.findById.mockResolvedValue(mockProduct);
      mockModifierSelectionService.resolve.mockReturnValue([]);

      await cartItemService.resolveProductWithModifiers('prod-10', 1, modifiersInput);

      expect(modifiersInput.length).toBe(originalLength);
    });
  });

  describe('areItemsIdentical', () => {
    it('should return true for identical items with same product and no modifiers', () => {
      const item1 = {
        cartItemId: 'cart-1',
        productId: 'prod-1',
        name: 'Burger',
        basePrice: new Money(1000),
        quantity: 1,
        modifiers: [],
      };

      const item2 = {
        cartItemId: 'cart-2',
        productId: 'prod-1',
        name: 'Burger',
        basePrice: new Money(1000),
        quantity: 2,
        modifiers: [],
      };

      expect(cartItemService.areItemsIdentical(item1, item2)).toBe(true);
    });

    it('should return false for different products', () => {
      const item1 = {
        cartItemId: 'cart-1',
        productId: 'prod-1',
        name: 'Burger',
        basePrice: new Money(1000),
        quantity: 1,
        modifiers: [],
      };

      const item2 = {
        cartItemId: 'cart-2',
        productId: 'prod-2',
        name: 'Fries',
        basePrice: new Money(500),
        quantity: 1,
        modifiers: [],
      };

      expect(cartItemService.areItemsIdentical(item1, item2)).toBe(false);
    });

    it('should return true for same product with same modifiers', () => {
      const item1 = {
        cartItemId: 'cart-1',
        productId: 'prod-1',
        name: 'Hot Dog',
        basePrice: new Money(800),
        quantity: 1,
        modifiers: [
          { groupId: 'protein', optionId: 'beef', name: 'Beef', price: new Money(0) },
          { groupId: 'sauce', optionId: 'ketchup', name: 'Ketchup', price: new Money(50) },
        ],
      };

      const item2 = {
        cartItemId: 'cart-2',
        productId: 'prod-1',
        name: 'Hot Dog',
        basePrice: new Money(800),
        quantity: 2,
        modifiers: [
          { groupId: 'protein', optionId: 'beef', name: 'Beef', price: new Money(0) },
          { groupId: 'sauce', optionId: 'ketchup', name: 'Ketchup', price: new Money(50) },
        ],
      };

      expect(cartItemService.areItemsIdentical(item1, item2)).toBe(true);
    });

    it('should return false for same product with different modifiers', () => {
      const item1 = {
        cartItemId: 'cart-1',
        productId: 'prod-1',
        name: 'Hot Dog',
        basePrice: new Money(800),
        quantity: 1,
        modifiers: [
          { groupId: 'protein', optionId: 'beef', name: 'Beef', price: new Money(0) },
          { groupId: 'sauce', optionId: 'ketchup', name: 'Ketchup', price: new Money(50) },
        ],
      };

      const item2 = {
        cartItemId: 'cart-2',
        productId: 'prod-1',
        name: 'Hot Dog',
        basePrice: new Money(800),
        quantity: 1,
        modifiers: [
          { groupId: 'protein', optionId: 'beef', name: 'Beef', price: new Money(0) },
          { groupId: 'sauce', optionId: 'mustard', name: 'Mustard', price: new Money(50) },
        ],
      };

      expect(cartItemService.areItemsIdentical(item1, item2)).toBe(false);
    });

    it('should return false for same product with different number of modifiers', () => {
      const item1 = {
        cartItemId: 'cart-1',
        productId: 'prod-1',
        name: 'Hot Dog',
        basePrice: new Money(800),
        quantity: 1,
        modifiers: [
          { groupId: 'protein', optionId: 'beef', name: 'Beef', price: new Money(0) },
          { groupId: 'sauce', optionId: 'ketchup', name: 'Ketchup', price: new Money(50) },
        ],
      };

      const item2 = {
        cartItemId: 'cart-2',
        productId: 'prod-1',
        name: 'Hot Dog',
        basePrice: new Money(800),
        quantity: 1,
        modifiers: [
          { groupId: 'protein', optionId: 'beef', name: 'Beef', price: new Money(0) },
        ],
      };

      expect(cartItemService.areItemsIdentical(item1, item2)).toBe(false);
    });

    it('should return true for same product with same modifiers in different order', () => {
      const item1 = {
        cartItemId: 'cart-1',
        productId: 'prod-1',
        name: 'Hot Dog',
        basePrice: new Money(800),
        quantity: 1,
        modifiers: [
          { groupId: 'sauce', optionId: 'ketchup', name: 'Ketchup', price: new Money(50) },
          { groupId: 'protein', optionId: 'beef', name: 'Beef', price: new Money(0) },
        ],
      };

      const item2 = {
        cartItemId: 'cart-2',
        productId: 'prod-1',
        name: 'Hot Dog',
        basePrice: new Money(800),
        quantity: 2,
        modifiers: [
          { groupId: 'protein', optionId: 'beef', name: 'Beef', price: new Money(0) },
          { groupId: 'sauce', optionId: 'ketchup', name: 'Ketchup', price: new Money(50) },
        ],
      };

      expect(cartItemService.areItemsIdentical(item1, item2)).toBe(true);
    });
  });
});
