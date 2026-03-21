import { menuRepository } from '@/infrastructure/container';
import { apiHandler } from './utils/api-handler';

export const handler = (event: any) =>
  apiHandler(
    event,
    async () => {
      const menu = await menuRepository.findAll();
      return menu;
    },
    { requireBody: false }
  );