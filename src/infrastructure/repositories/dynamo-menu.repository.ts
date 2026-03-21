import * as dotenv from 'dotenv';
import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { dynamoDB } from '@/infrastructure/database/dynamo.client';
import { MenuProduct, MenuRepository } from '@/domain/repositories/menu.repository';

// Load environment variables
dotenv.config();

export class DynamoMenuRepository implements MenuRepository {
  async findAll(): Promise<MenuProduct[]> {
    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: process.env.TABLE_MENU,
      })
    );

    return (result.Items as MenuProduct[]) || [];
  }

  async findById(productId: string): Promise<MenuProduct | null> {
    const result = await dynamoDB.send(
      new GetCommand({
        TableName: process.env.TABLE_MENU,
        Key: { productId },
      })
    );

    return (result.Item as MenuProduct) || null;
  }
}
