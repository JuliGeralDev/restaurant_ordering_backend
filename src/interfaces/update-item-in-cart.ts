import { orderRepository, timelineRepository, menuRepository } from '@/infrastructure/container';
import { UpdateItemInCartUseCase } from '@/application/use-cases/update-item-in-cart.use-case';
import { PricingService } from '@/domain/services/pricing.service';
import { apiHandler } from './utils/api-handler';
import { logSafe } from '@/infrastructure/logging/logger';
import { validator } from './utils/field-validator';

const pricingService = new PricingService();

export const handler = (event: any) =>
  apiHandler(event, async (event, body) => {
    logSafe('Received update-item-in-cart request', event.body);

    const {
      orderId,
      userId,
      productId,
      quantity,
      modifiers = [],
    } = body;

    validator.required('orderId', orderId);
    validator.required('userId', userId);
    validator.required('productId', productId);
    const quantityNum = validator.isPositiveInteger('quantity', quantity);

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

    return result;
  });
