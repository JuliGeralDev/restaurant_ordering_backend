import { OrderItem } from '@/domain/entities/order.entity';
import { MenuRepository } from '@/domain/repositories/menu.repository';
import { ModifierSelectionInput, ModifierSelectionService } from '@/domain/services/modifier-selection.service';
import { Money } from '@/domain/value-objects/money.vo';
import { NotFoundError } from '@/domain/errors/not-found.error';
import { randomUUID } from 'crypto';

export class CartItemService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly modifierSelectionService: ModifierSelectionService
  ) {}

  async resolveProductWithModifiers(
    productId: string,
    quantity: number,
    modifiers?: ModifierSelectionInput[]
  ): Promise<OrderItem> {
    const product = await this.menuRepository.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const basePrice = new Money(product.basePrice);
    const resolvedModifiers = this.modifierSelectionService.resolve(product, modifiers);

    return {
      cartItemId: randomUUID(),
      productId: product.productId,
      name: product.name,
      basePrice,
      quantity,
      modifiers: resolvedModifiers,
    };
  }

  /**
   * Compares two cart items to determine if they are identical
   * (same product with same modifiers configuration)
   */
  areItemsIdentical(item1: OrderItem, item2: OrderItem): boolean {
    if (item1.productId !== item2.productId) {
      return false;
    }

    // Compare modifiers - same length and same selections
    if (item1.modifiers.length !== item2.modifiers.length) {
      return false;
    }

    // Sort modifiers by groupId+optionId to ensure consistent comparison
    const sorted1 = [...item1.modifiers].sort((a, b) => 
      `${a.groupId}-${a.optionId}`.localeCompare(`${b.groupId}-${b.optionId}`)
    );
    const sorted2 = [...item2.modifiers].sort((a, b) => 
      `${a.groupId}-${a.optionId}`.localeCompare(`${b.groupId}-${b.optionId}`)
    );

    return sorted1.every((mod1, index) => {
      const mod2 = sorted2[index];
      return mod1.groupId === mod2.groupId && mod1.optionId === mod2.optionId;
    });
  }
}
