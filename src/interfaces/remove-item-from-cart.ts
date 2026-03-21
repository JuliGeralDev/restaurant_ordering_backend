import { orderRepository, timelineRepository } from '@/infrastructure/container';
import { OrderPricingService } from '@/application/services/order-pricing.service';
import { PricingService } from '@/domain/services/pricing.service';
import { RemoveItemFromCartUseCase } from '@/application/use-cases/remove-item-from-cart.use-case';
import { apiHandler } from './utils/api-handler';
import { validator } from './utils/field-validator';

const pricingService = new PricingService();
const orderPricingService = new OrderPricingService(pricingService);

export const handler = (event: any) =>
  apiHandler(event, async ( body) => {
    const { orderId, userId, productId } = body;

    validator.required('orderId', orderId);
    validator.required('userId', userId);
    validator.required('productId', productId);

    const useCase = new RemoveItemFromCartUseCase(
      orderRepository,
      timelineRepository,
      orderPricingService
    );

    const result = await useCase.execute({
      orderId,
      userId,
      productId,
    });

    return result.order;
  });
