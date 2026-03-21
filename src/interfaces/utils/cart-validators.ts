import { ModifierSelectionInput } from '@/domain/services/modifier-selection.service';

import { validator } from './field-validator';

interface CartBody {
  orderId?: string;
  userId?: string;
  productId?: string;
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

export interface ValidatedCartRemovalInput {
  orderId: string;
  userId: string;
  productId: string;
}

export function validateAddItemRequest(body: CartBody): ValidatedCartMutationInput {
  validator.required('userId', body.userId);
  validator.required('productId', body.productId);

  return {
    orderId: body.orderId || undefined,
    userId: body.userId,
    productId: body.productId,
    quantity: validator.isPositiveInteger('quantity', body.quantity),
    modifiers: normalizeModifiers(body.modifiers),
  };
}

export function validateUpdateItemRequest(body: CartBody): ValidatedCartMutationInput {
  validator.required('orderId', body.orderId);
  validator.required('userId', body.userId);
  validator.required('productId', body.productId);

  return {
    orderId: body.orderId,
    userId: body.userId,
    productId: body.productId,
    quantity: validator.isPositiveInteger('quantity', body.quantity),
    modifiers: normalizeModifiers(body.modifiers),
  };
}

export function validateRemoveItemRequest(body: CartBody): ValidatedCartRemovalInput {
  validator.required('orderId', body.orderId);
  validator.required('userId', body.userId);
  validator.required('productId', body.productId);

  return {
    orderId: body.orderId,
    userId: body.userId,
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
