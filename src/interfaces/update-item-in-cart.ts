import { orderRepository, timelineRepository } from '@/infrastructure/container';
import { UpdateItemInCartUseCase } from '@/application/use-cases/update-item-in-cart.use-case';
import { PricingService } from '@/domain/services/pricing.service';
import { menuRepository } from '@/infrastructure/container';
import { validatePayloadSize } from './utils/payload-validator';
import { logSafe } from '@/infrastructure/logging/logger';

const pricingService = new PricingService();

export const handler = async (event: any) => {
  try {
    validatePayloadSize(event.body);
    logSafe('Received update-item-in-cart request', event.body);

    const body = JSON.parse(event.body || '{}');

    const {
      orderId,
      userId,
      productId,
      quantity,
      modifiers = [],
    } = body;

    // Validate basic inputs
    if (!orderId || !userId || !productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'orderId, userId, and productId are required',
        }),
      };
    }

    // Convert quantity to number and validate
    const quantityNum = Number(quantity);
    if (!Number.isInteger(quantityNum) || quantityNum < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'quantity must be a positive integer',
        }),
      };
    }

    // Transform modifiers from simple format {type, value} to full format {groupId, optionId, name, price}
    const transformedModifiers = modifiers.map((mod: any) => ({
      groupId: mod.type || mod.groupId,
      optionId: mod.value || mod.optionId,
      name: mod.name || mod.value || mod.optionId,
      price: mod.price || 0,
    }));

    const useCase = new UpdateItemInCartUseCase(
      orderRepository,
      pricingService,
      timelineRepository,
      menuRepository
    );

    const result = await useCase.execute({
      orderId,
      userId,
      productId,
      quantity: quantityNum,
      modifiers: transformedModifiers,
    });

    return {
      statusCode: 200,
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
