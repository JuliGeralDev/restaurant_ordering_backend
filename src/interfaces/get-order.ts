import { orderRepository } from '@/infrastructure/container';
import { toOrderDTO } from './mappers/order.mapper';
import { NotFoundError } from '@/domain/errors/not-found.error';
import { apiHandler } from './utils/api-handler';
import { LambdaEvent } from './types/lambda-event.type';

export const handler = (event: LambdaEvent) =>
  apiHandler(
    event,
    async (event) => {
      const { orderId } = event.pathParameters;

      const order = await orderRepository.findById(orderId);

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      return toOrderDTO(order);
    },
    { requireBody: false }
  );