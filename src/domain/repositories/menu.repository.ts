export interface MenuModifierOption {
  name: string;
  price: number;
}

export interface MenuModifierGroup {
  required?: boolean;
  max?: number;
  options: Record<string, MenuModifierOption>;
}

export interface MenuProduct {
  productId: string;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  modifiers?: Record<string, MenuModifierGroup>;
}

export interface MenuRepository {
  findAll(): Promise<MenuProduct[]>;
  findById(productId: string): Promise<MenuProduct | null>;
}
