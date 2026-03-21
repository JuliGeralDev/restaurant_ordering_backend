import { orderRepository, timelineRepository, idempotencyRepository } from '@/infrastructure/container';
import { PlaceOrderUseCase } from '@/application/use-cases/place-order.use-case';
import { apiHandler } from './utils/api-handler';
import { validator } from './utils/field-validator';
import { ValidationError } from '@/domain/errors/validation.error';
import { IdempotencyConflictError } from '@/domain/errors/idempotency-conflict.error';
import { LambdaEvent } from './types/lambda-event.type';

export const handler = (event: LambdaEvent) =>
  apiHandler(
    event,
    async (event, body) => {
      const { orderId, userId } = body;

      validator.required('orderId', orderId);
      validator.required('userId', userId);

      const key =
        event.headers?.['Idempotency-Key'] ||
        event.headers?.['idempotency-key'];

      if (!key) {
        throw new ValidationError('Idempotency-Key header is required');
      }

      const existing = await idempotencyRepository.findByKey(key);

      if (existing) {
        if (
          existing.response.orderId !== orderId ||
          existing.response.userId !== userId
        ) {
          throw new IdempotencyConflictError('Idempotency key conflict: orderId or userId mismatch');
        }

        return existing.response;
      }

      const useCase = new PlaceOrderUseCase(
        orderRepository,
        timelineRepository
      );

      const result = await useCase.execute({
        orderId,
        userId,
        correlationId: key,
      });

      await idempotencyRepository.save({
        key,
        response: result,
        createdAt: new Date().toISOString(),
      });

      return result;
    },
    { successStatusCode: 202 }
  );