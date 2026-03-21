import { DynamoOrderRepository } from './repositories/dynamo-order.repository';
import { DynamoTimelineRepository } from './repositories/dynamo-timeline.repository';
import { DynamoIdempotencyRepository } from './repositories/dynamo-idempotency.repository';
import { DynamoMenuRepository } from './repositories/dynamo-menu.repository';

export const orderRepository = new DynamoOrderRepository();
export const timelineRepository = new DynamoTimelineRepository();
export const idempotencyRepository = new DynamoIdempotencyRepository(); 
export const menuRepository = new DynamoMenuRepository();