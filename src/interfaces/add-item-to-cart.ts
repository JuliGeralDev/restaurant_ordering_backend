import { orderRepository, timelineRepository, menuRepository } from '@/infrastructure/container';
import { AddItemToCartUseCase } from '@/application/use-cases/add-item-to-cart.use-case';
import { PricingService } from '@/domain/services/pricing.service';
import { apiHandler } from './utils/api-handler';
import { logSafe } from '@/infrastructure/logging/logger';
import { validator } from './utils/field-validator';


const pricingService = new PricingService();

export const handler = (event: any) =>
  apiHandler(event, async (event, body) => {
    logSafe('Received add-item-to-cart request', event.body);

    const {
      orderId,
      userId,
      productId,
      quantity,
      modifiers = [],
    } = body;

    validator.required('userId', userId);
    validator.required('productId', productId);
    const quantityNum = validator.isPositiveInteger('quantity', quantity);

    const transformedModifiers = modifiers.map((mod: any) => ({
      groupId: mod.type || mod.groupId,
      optionId: mod.value || mod.optionId,
      name: mod.name || mod.value || mod.optionId,
      price: mod.price || 0,
    }));

    const useCase = new AddItemToCartUseCase(
      orderRepository,
      pricingService,
      timelineRepository,
      menuRepository
    );

    const result = await useCase.execute({
      orderId: orderId || undefined,
      userId,
      productId,
      quantity: quantityNum,
      modifiers: transformedModifiers,
    });

    return result.order;
  });