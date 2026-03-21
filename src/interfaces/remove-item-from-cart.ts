import { removeItemFromCartUseCase } from '@/application/cart-use-cases';
import { apiHandler } from './utils/api-handler';
import { validateRemoveItemRequest } from './utils/cart-validators';
import { LambdaEvent } from './types/lambda-event.type';

export const handler = (event: LambdaEvent) =>
  apiHandler(event, async ( body) => {
    const input = validateRemoveItemRequest(body);
    const result = await removeItemFromCartUseCase.execute(input);

    return result.order;
  });
