import { addItemToCartUseCase } from '@/application/cart-use-cases';
import { apiHandler } from './utils/api-handler';
import { logSafe } from '@/infrastructure/logging/logger';
import { validateAddItemRequest } from './utils/cart-validators';
import { LambdaEvent } from './types/lambda-event.type';

export const handler = (event: LambdaEvent) =>
  apiHandler(event, async (event, body) => {
    logSafe('Received add-item-to-cart request', event.body);

    const input = validateAddItemRequest(body);
    const result = await addItemToCartUseCase.execute(input);

    return result.order;
  });
