import { PlaceOrderUseCase } from '@/application/use-cases/place-order.use-case';
import { OrderService } from '@/application/services/order.service';
import { Order } from '@/domain/entities/order.entity';
import { OrderRepository } from '@/domain/repositories/order.repository';
import { TimelineRepository } from '@/domain/repositories/timeline.repository';
import { Money } from '@/domain/value-objects/money.vo';

describe('PlaceOrderUseCase', () => {
  let orderRepository: jest.Mocked<OrderRepository>;
  let timelineRepository: jest.Mocked<TimelineRepository>;
  let orderService: OrderService;
  let useCase: PlaceOrderUseCase;

  const buildOrder = (status: Order['status']): Order => ({
    orderId: 'order-123',
    userId: 'user-456',
    status,
    items: [],
    pricing: {
      subtotal: new Money(1000),
      tax: new Money(100),
      serviceFee: new Money(50),
      total: new Money(1150),
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  beforeEach(() => {
    orderRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
    };

    timelineRepository = {
      save: jest.fn(),
      findByOrderId: jest.fn(),
    };

    orderService = new OrderService(orderRepository);
    useCase = new PlaceOrderUseCase(
      orderRepository,
      timelineRepository,
      orderService
    );
  });

  it('moves a created order to processing and requests async completion', async () => {
    orderRepository.findById.mockResolvedValue(buildOrder('CREATED'));

    const result = await useCase.execute({
      orderId: 'order-123',
      userId: 'user-456',
      correlationId: 'corr-789',
    });

    expect(result.status).toBe('PROCESSING');
    expect(result.shouldScheduleProcessing).toBe(true);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
    expect(timelineRepository.save).toHaveBeenCalledTimes(2);
  });

  it('does not reschedule orders that are already processing', async () => {
    orderRepository.findById.mockResolvedValue(buildOrder('PROCESSING'));

    const result = await useCase.execute({
      orderId: 'order-123',
      userId: 'user-456',
      correlationId: 'corr-789',
    });

    expect(result.status).toBe('PROCESSING');
    expect(result.shouldScheduleProcessing).toBe(false);
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(timelineRepository.save).not.toHaveBeenCalled();
  });
});
