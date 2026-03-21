import { 
  DynamoDBClient, 
  CreateTableCommand, 
  ListTablesCommand,
  DescribeTableCommand 
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT,
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
    description:
      'Juicy grilled beef burger served with fresh lettuce, tomato, onion and our classic house sauce on a toasted brioche bun.',
    basePrice: 18000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135398/custom_burguer_xpp1ux.jpg', 
  },
  {
    productId: '2',
    name: 'Double Cheese Burger',
    description:
      'Two grilled beef patties stacked with melted cheddar cheese, pickles, onions and house burger sauce on a toasted bun.',
    basePrice: 21000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135727/chesee_burger_fq95lb.jpg', 
  },
  {
    productId: '3',
    name: 'Pepperoni Pizza',
    description:
      'Classic Italian pizza with tomato sauce, melted mozzarella cheese and crispy pepperoni slices on a stone-baked crust.',
    basePrice: 24000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135786/pizza1_es8hkr.jpg', 
  },
  {
    productId: '4',
    name: 'Four Cheese Pizza',
    description:
      'Creamy pizza made with mozzarella, cheddar, parmesan and blue cheese on a golden baked crust with tomato sauce.',
    basePrice: 25000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135786/pizza1_es8hkr.jpg', 
  },
  {
    productId: '5',
    name: 'Italian Lasagna',
    description:
      'Traditional baked lasagna layered with pasta sheets, seasoned beef, tomato sauce and creamy béchamel topped with melted cheese.',
    basePrice: 23000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135855/lasagna_dmrhmq.jpg', 
  },
  {
    productId: '6',
    name: 'Coca-Cola',
    description:
      'Refreshing chilled Coca-Cola served cold. Perfect to pair with burgers, pizza or tacos.',
    basePrice: 6000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135913/coca-cola_qtfglb.jpg', 
  },
  {
    productId: '7',
    name: 'Pepsi',
    description:
      'Classic Pepsi soda served ice cold, a refreshing drink to accompany any meal.',
    basePrice: 6000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135912/sverre-2peR6-qWyeo-unsplash_kiwucs.jpg', 
  },

  // PRODUCTO CON MODIFIERS
  {
    productId: '8',
    name: 'Custom Burger',
    description:
      'Build your own burger by choosing your preferred protein, toppings and sauces.',
    basePrice: 19000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135634/custom_burger_xh97tj.jpg',
    modifiers: {
      protein: {
        required: true,
        options: {
          beef: { name: 'Beef Patty', price: 0 },
          chicken: { name: 'Grilled Chicken', price: 0 },
          veggie: { name: 'Veggie Patty', price: 0 },
        },
      },
      toppings: {
        required: false,
        max: 4,
        options: {
          lettuce: { name: 'Lettuce', price: 0 },
          tomato: { name: 'Tomato', price: 0 },
          onion: { name: 'Onion', price: 0 },
          cheese: { name: 'Cheddar Cheese', price: 500 },
          bacon: { name: 'Crispy Bacon', price: 900 },
        },
      },
      sauces: {
        required: false,
        max: 2,
        options: {
          ketchup: { name: 'Ketchup', price: 0 },
          mayo: { name: 'Mayonnaise', price: 300 },
          bbq: { name: 'BBQ Sauce', price: 400 },
        },
      },
    },
  },

  // PRODUCTO CON MODIFIERS
  {
    productId: '9',
    name: 'Custom Hot Dog',
    description:
      'Grilled hot dog in a toasted bun that you can customize with toppings and sauces.',
    basePrice: 15000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135970/hot-dog_yoavkv.jpg',
    modifiers: {
      protein: {
        required: true,
        options: {
          classic: { name: 'Classic Sausage', price: 0 },
          beef: { name: 'Beef Sausage', price: 1000 },
        },
      },
      toppings: {
        required: false,
        max: 3,
        options: {
          cheese: { name: 'Cheese', price: 500 },
          bacon: { name: 'Bacon', price: 800 },
          onion: { name: 'Onion', price: 300 },
          jalapeno: { name: 'Jalapeño', price: 400 },
        },
      },
      sauces: {
        required: false,
        max: 2,
        options: {
          ketchup: { name: 'Ketchup', price: 0 },
          mayo: { name: 'Mayonnaise', price: 300 },
          mustard: { name: 'Mustard', price: 200 },
        },
      },
    },
  },

  // PRODUCTO CON MODIFIERS
  {
    productId: '10',
    name: 'Custom Tacos',
    description:
      'Three soft tacos that you can customize with your favorite protein, toppings and sauces.',
    basePrice: 20000,
    imageUrl: 'https://res.cloudinary.com/dualohbya/image/upload/v1774135992/tacos_ppevtl.jpg',
    modifiers: {
      protein: {
        required: true,
        options: {
          beef: { name: 'Beef', price: 0 },
          chicken: { name: 'Chicken', price: 0 },
          pork: { name: 'Pork', price: 0 },
        },
      },
      toppings: {
        required: false,
        max: 4,
        options: {
          guacamole: { name: 'Guacamole', price: 1200 },
          cheese: { name: 'Cheese', price: 500 },
          lettuce: { name: 'Lettuce', price: 0 },
          pico: { name: 'Pico de Gallo', price: 600 },
        },
      },
      sauces: {
        required: false,
        max: 2,
        options: {
          salsa_roja: { name: 'Red Salsa', price: 0 },
          salsa_verde: { name: 'Green Salsa', price: 0 },
          chipotle: { name: 'Chipotle Sauce', price: 500 },
        },
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
    console.log('  • ID 1-2: Burgers (2 items)');
    console.log('  • ID 3-4: Pizzas (2 items)');
    console.log('  • ID 5: Lasagna');
    console.log('  • ID 6-7: Drinks (2 items)');
    console.log('  • ID 8: Custom Burger (with modifiers)');
    console.log('  • ID 9: Custom Hot Dog (with modifiers)');
    console.log('  • ID 10: Custom Tacos (with modifiers)');
    console.log('\nTotal: 10 menu items');
    console.log('Products with modifiers: 3 (Custom Burger, Custom Hot Dog, Custom Tacos)');
    console.log('All products include: name, description, basePrice, imageUrl');
    
  } catch (error) {
    console.error('\n❌ Error initializing database:', error);
    console.error('\nMake sure DynamoDB Local is running:');
    console.error('  docker-compose up -d');
    process.exit(1);
  }
}

main();