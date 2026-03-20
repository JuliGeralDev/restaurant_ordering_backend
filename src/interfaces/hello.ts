import { AddItemToCartUseCase } from '@/application/use-cases/add-item-to-cart.use-case';
import { InMemoryOrderRepository } from '@/infrastructure/repositories/in-memory-order.repository';

export const handler = async () => {
  const repository = new InMemoryOrderRepository();
  const useCase = new AddItemToCartUseCase(repository);

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