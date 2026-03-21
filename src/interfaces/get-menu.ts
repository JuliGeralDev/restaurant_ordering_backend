import { menuRepository } from '@/infrastructure/container';
import { apiHandler } from './utils/api-handler';
import { LambdaEvent } from './types/lambda-event.type';

export const handler = (event: LambdaEvent) =>
  apiHandler(
    event,
    async () => {
      const menu = await menuRepository.findAll();
      return menu;
    },
    { requireBody: false }
  );