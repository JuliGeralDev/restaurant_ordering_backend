import { ModifierSelectionInput } from '@/domain/services/modifier-selection.service';

import { validator } from './field-validator';

interface CartBody {
  orderId?: string;
  userId?: string;
  productId?: string;
  cartItemId?: string;
  quantity?: unknown;
  modifiers?: any[];
}

export interface ValidatedCartMutationInput {
  orderId?: string;
  userId: string;
  productId: string;
  quantity: number;
  modifiers: ModifierSelectionInput[];
}

export interface ValidatedCartUpdateInput {
  orderId: string;
  userId: string;
  cartItemId: string;
  quantity: number;
  modifiers: ModifierSelectionInput[];
}

export interface ValidatedCartRemovalInput {
  orderId: string;
  userId: string;
  cartItemId?: string;  // Remove specific item instance (decrement or delete)
  productId?: string;   // Remove ALL instances of this product
}

export function validateAddItemRequest(body: CartBody): ValidatedCartMutationInput {
  validator.required('userId', body.userId);
  validator.required('productId', body.productId);

  return {
    orderId: body.orderId || undefined,
    userId: body.userId!,
    productId: body.productId!,
    quantity: validator.isPositiveInteger('quantity', body.quantity),
    modifiers: normalizeModifiers(body.modifiers),
  };
}

export function validateUpdateItemRequest(body: CartBody): ValidatedCartUpdateInput {
  validator.required('orderId', body.orderId);
  validator.required('userId', body.userId);
  validator.required('cartItemId', body.cartItemId);

  return {
    orderId: body.orderId!,
    userId: body.userId!,
    cartItemId: body.cartItemId!,
    quantity: validator.isPositiveInteger('quantity', body.quantity),
    modifiers: normalizeModifiers(body.modifiers),
  };
}

export function validateRemoveItemRequest(body: CartBody): ValidatedCartRemovalInput {
  validator.required('orderId', body.orderId);
  validator.required('userId', body.userId);

  if (!body.cartItemId && !body.productId) {
    throw new (require('@/domain/errors/validation.error').ValidationError)(
      'Either cartItemId or productId is required'
    );
  }

  return {
    orderId: body.orderId!,
    userId: body.userId!,
    cartItemId: body.cartItemId,
    productId: body.productId,
  };
}

function normalizeModifiers(modifiers: any[] = []): ModifierSelectionInput[] {
  return modifiers.map((modifier) => ({
    groupId: modifier.type || modifier.groupId,
    optionId: modifier.value || modifier.optionId,
    name: modifier.name || modifier.value || modifier.optionId,
    price: modifier.price || 0,
  }));
}
