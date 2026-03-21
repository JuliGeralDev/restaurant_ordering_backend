import { timelineRepository } from '@/infrastructure/container';
import { apiHandler } from './utils/api-handler';
import { validator } from './utils/field-validator';

export const handler = (event: any) =>
  apiHandler(
    event,
    async (event) => {
      const { orderId } = event.pathParameters;
      const { pageSize = '10', nextToken } = event.queryStringParameters || {};

      const pageSizeNum = validator.isPositiveInteger('pageSize', pageSize);
      validator.inRange('pageSize', pageSizeNum, 1, 50);

      const result = await timelineRepository.findByOrderId(
        orderId,
        pageSizeNum,
        nextToken
      );

      return result;
    },
    { requireBody: false }
  );