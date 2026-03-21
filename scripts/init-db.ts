import { 
  DynamoDBClient, 
  CreateTableCommand, 
  ListTablesCommand,
  DescribeTableCommand 
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
});

const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertClassInstanceToMap: true,
  },
});

// Table definitions
const TABLES = {
  orders: {
    TableName: 'orders',
    AttributeDefinitions: [
      { AttributeName: 'orderId', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'orderId', KeyType: 'HASH' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  timeline: {
    TableName: 'order_timeline',
    AttributeDefinitions: [
      { AttributeName: 'orderId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'orderId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  menu: {
    TableName: 'menu',
    AttributeDefinitions: [
      { AttributeName: 'productId', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'productId', KeyType: 'HASH' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  idempotency: {
    TableName: 'idempotency',
    AttributeDefinitions: [
      { AttributeName: 'key', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'key', KeyType: 'HASH' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  }
};

// Sample menu data
const SAMPLE_MENU = [
  {
    productId: '1',
    name: 'Classic Burger',
    basePrice: 15000,
  },
  {
    productId: '2',
    name: 'Cheese Burger',
    basePrice: 17000,
  },
  {
    productId: '3',
    name: 'Chicken Burger',
    basePrice: 16000,
  },
  {
    productId: '4',
    name: 'Veggie Burger',
    basePrice: 14000,
  },
  {
    productId: '5',
    name: 'Double Burger',
    basePrice: 20000,
  },
  {
    productId: '6',
    name: 'Hot Dog',
    basePrice: 12000,
  },
  {
    productId: '7',
    name: 'Fries',
    basePrice: 8000,
  },
  {
    productId: '8',
    name: 'Onion Rings',
    basePrice: 9000,
  },
  {
    productId: '9',
    name: 'Soda',
    basePrice: 5000,
  },
  {
    productId: '10',
    name: 'Custom Burger',
    basePrice: 18000,
    modifiers: {
      protein: {
        required: true,
        options: ['beef', 'chicken', 'veggie'],
      },
      toppings: {
        required: false,
        max: 3,
        options: ['lettuce', 'tomato', 'onion', 'cheese'],
      },
      sauces: {
        required: false,
        max: 2,
        options: ['ketchup', 'mayo', 'bbq'],
      },
    },
  },
];

async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { TableNames } = await client.send(new ListTablesCommand({}));
    return TableNames?.includes(tableName) || false;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

async function waitForTableActive(tableName: string): Promise<void> {
  console.log(`Waiting for table ${tableName} to become active...`);
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      const { Table } = await client.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      
      if (Table?.TableStatus === 'ACTIVE') {
        console.log(`✓ Table ${tableName} is active`);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }
  
  throw new Error(`Table ${tableName} did not become active in time`);
}

async function createTable(tableConfig: any): Promise<void> {
  const exists = await tableExists(tableConfig.TableName);
  
  if (exists) {
    console.log(`✓ Table ${tableConfig.TableName} already exists`);
    return;
  }
  
  try {
    console.log(`Creating table ${tableConfig.TableName}...`);
    await client.send(new CreateTableCommand(tableConfig));
    await waitForTableActive(tableConfig.TableName);
    console.log(`✓ Table ${tableConfig.TableName} created successfully`);
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`✓ Table ${tableConfig.TableName} already exists`);
    } else {
      throw error;
    }
  }
}

async function seedMenu(): Promise<void> {
  console.log('\nSeeding menu items...');
  
  for (const item of SAMPLE_MENU) {
    try {
      await dynamoDB.send(
        new PutCommand({
          TableName: 'menu',
          Item: {
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      );
      console.log(`✓ Added menu item: ${item.name}`);
    } catch (error) {
      console.error(`✗ Error adding menu item ${item.name}:`, error);
    }
  }
}

async function main() {
  console.log('🚀 Initializing DynamoDB Local...\n');
  
  try {
    // Test connection
    console.log('Testing DynamoDB connection...');
    await client.send(new ListTablesCommand({}));
    console.log('✓ Connected to DynamoDB Local\n');
    
    // Create tables
    console.log('Creating tables...');
    await createTable(TABLES.orders);
    await createTable(TABLES.timeline);
    await createTable(TABLES.menu);
    await createTable(TABLES.idempotency);
    
    // Seed data
    await seedMenu();
    
    console.log('\n✅ Database initialization completed successfully!');
    console.log('\nMenu items created:');
    console.log('  • ID 1-5: Burgers (5 items)');
    console.log('  • ID 6: Hot Dog');
    console.log('  • ID 7-8: Sides (2 items)');
    console.log('  • ID 9: Drink');
    console.log('  • ID 10: Custom Burger (with modifiers)');
    console.log('\nTotal: 10 menu items');
    
  } catch (error) {
    console.error('\n❌ Error initializing database:', error);
    console.error('\nMake sure DynamoDB Local is running:');
    console.error('  docker-compose up -d');
    process.exit(1);
  }
}

main();