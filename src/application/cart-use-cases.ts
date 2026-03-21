import { AddItemToCartUseCase } from '@/application/use-cases/add-item-to-cart.use-case';
import { RemoveItemFromCartUseCase } from '@/application/use-cases/remove-item-from-cart.use-case';
import { UpdateItemInCartUseCase } from '@/application/use-cases/update-item-in-cart.use-case';
import { OrderPricingService } from '@/application/services/order-pricing.service';
import { ModifierSelectionService } from '@/domain/services/modifier-selection.service';
import { PricingService } from '@/domain/services/pricing.service';
import { menuRepository, orderRepository, timelineRepository } from '@/infrastructure/container';

const pricingService = new PricingService();
const orderPricingService = new OrderPricingService(pricingService);
const modifierSelectionService = new ModifierSelectionService();

export const addItemToCartUseCase = new AddItemToCartUseCase(
  orderRepository,
  orderPricingService,
  timelineRepository,
  menuRepository,
  modifierSelectionService
);

export const updateItemInCartUseCase = new UpdateItemInCartUseCase(
  orderRepository,
  orderPricingService,
  timelineRepository,
  menuRepository,
  modifierSelectionService
);

export const removeItemFromCartUseCase = new RemoveItemFromCartUseCase(
  orderRepository,
  timelineRepository,
  orderPricingService
);
