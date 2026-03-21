import { menuRepository } from '@/infrastructure/container';

export const handler = async () => {
  const menu = await menuRepository.findAll();

  return {
    statusCode: 200,
    body: JSON.stringify(menu),
  };
};