import { AddItemToCartUseCase } from '@/application/use-cases/add-item-to-cart.use-case';
import { InMemoryOrderRepository } from '@/infrastructure/repositories/in-memory-order.repository';
import { PricingService } from '@/domain/services/pricing.service';

export const handler = async () => {
  const repository = new InMemoryOrderRepository();
  const pricingService = new PricingService();
  const useCase = new AddItemToCartUseCase(repository, pricingService);


  const result = await useCase.execute({
    orderId: 'order-1',
    userId: 'user-1',
    productId: 'product-1',
    name: 'Burger',
    basePrice: 10000,
    quantity: 2,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};