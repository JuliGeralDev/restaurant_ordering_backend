import { orderRepository, timelineRepository } from '@/infrastructure/container';
import { PlaceOrderUseCase } from '@/application/use-cases/place-order.use-case';

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || '{}');

    const { orderId, userId } = body;

    if (!orderId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'orderId and userId are required',
        }),
      };
    }

    const correlationId =
      event.headers?.['Idempotency-Key'] ||
      event.headers?.['idempotency-key'] ||
      crypto.randomUUID();

    const useCase = new PlaceOrderUseCase(
      orderRepository,
      timelineRepository
    );

    const result = await useCase.execute({
      orderId,
      userId,
      correlationId,
    });

    return {
      statusCode: 202,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message,
      }),
    };
  }
};