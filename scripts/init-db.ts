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
  products: {
    TableName: 'products',
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
const SAMPLE_PRODUCTS = [
  {
    productId: 'burger-classic',
    name: 'Classic Burger',
    description: 'Hamburguesa clásica con lechuga, tomate, cebolla y queso',
    category: 'burgers',
    basePrice: 12000,
    available: true,
    imageUrl: 'https://example.com/burger-classic.jpg',
    modifierGroups: [
      {
        groupId: 'extras',
        name: 'Extras',
        required: false,
        multiSelect: true,
        options: [
          { optionId: 'extra-cheese', name: 'Queso extra', price: 2000 },
          { optionId: 'bacon', name: 'Tocineta', price: 3000 },
          { optionId: 'avocado', name: 'Aguacate', price: 3500 }
        ]
      },
      {
        groupId: 'cooking-point',
        name: 'Punto de cocción',
        required: true,
        multiSelect: false,
        options: [
          { optionId: 'rare', name: 'Poco cocida', price: 0 },
          { optionId: 'medium', name: 'Término medio', price: 0 },
          { optionId: 'well-done', name: 'Bien cocida', price: 0 }
        ]
      }
    ]
  },
  {
    productId: 'burger-bbq',
    name: 'BBQ Burger',
    description: 'Hamburguesa con salsa BBQ, cebolla caramelizada y queso cheddar',
    category: 'burgers',
    basePrice: 14000,
    available: true,
    imageUrl: 'https://example.com/burger-bbq.jpg',
    modifierGroups: [
      {
        groupId: 'extras',
        name: 'Extras',
        required: false,
        multiSelect: true,
        options: [
          { optionId: 'extra-cheese', name: 'Queso extra', price: 2000 },
          { optionId: 'bacon', name: 'Tocineta', price: 3000 },
          { optionId: 'onion-rings', name: 'Aros de cebolla', price: 2500 }
        ]
      }
    ]
  },
  {
    productId: 'pizza-margherita',
    name: 'Pizza Margherita',
    description: 'Pizza clásica con tomate, mozzarella y albahaca fresca',
    category: 'pizzas',
    basePrice: 18000,
    available: true,
    imageUrl: 'https://example.com/pizza-margherita.jpg',
    modifierGroups: [
      {
        groupId: 'size',
        name: 'Tamaño',
        required: true,
        multiSelect: false,
        options: [
          { optionId: 'small', name: 'Personal (8")', price: 0 },
          { optionId: 'medium', name: 'Mediana (12")', price: 4000 },
          { optionId: 'large', name: 'Grande (16")', price: 8000 }
        ]
      },
      {
        groupId: 'extra-toppings',
        name: 'Ingredientes adicionales',
        required: false,
        multiSelect: true,
        options: [
          { optionId: 'pepperoni', name: 'Pepperoni', price: 3000 },
          { optionId: 'mushrooms', name: 'Champiñones', price: 2500 },
          { optionId: 'olives', name: 'Aceitunas', price: 2000 }
        ]
      }
    ]
  },
  {
    productId: 'pizza-pepperoni',
    name: 'Pizza Pepperoni',
    description: 'Pizza con abundante pepperoni y mozzarella',
    category: 'pizzas',
    basePrice: 20000,
    available: true,
    imageUrl: 'https://example.com/pizza-pepperoni.jpg',
    modifierGroups: [
      {
        groupId: 'size',
        name: 'Tamaño',
        required: true,
        multiSelect: false,
        options: [
          { optionId: 'small', name: 'Personal (8")', price: 0 },
          { optionId: 'medium', name: 'Mediana (12")', price: 4000 },
          { optionId: 'large', name: 'Grande (16")', price: 8000 }
        ]
      }
    ]
  },
  {
    productId: 'pasta-carbonara',
    name: 'Pasta Carbonara',
    description: 'Pasta con salsa carbonara cremosa, tocineta y queso parmesano',
    category: 'pastas',
    basePrice: 16000,
    available: true,
    imageUrl: 'https://example.com/pasta-carbonara.jpg',
    modifierGroups: [
      {
        groupId: 'pasta-type',
        name: 'Tipo de pasta',
        required: true,
        multiSelect: false,
        options: [
          { optionId: 'spaghetti', name: 'Spaghetti', price: 0 },
          { optionId: 'penne', name: 'Penne', price: 0 },
          { optionId: 'fettuccine', name: 'Fettuccine', price: 0 }
        ]
      }
    ]
  },
  {
    productId: 'salad-caesar',
    name: 'Ensalada César',
    description: 'Lechuga romana, crutones, queso parmesano y aderezo césar',
    category: 'salads',
    basePrice: 11000,
    available: true,
    imageUrl: 'https://example.com/salad-caesar.jpg',
    modifierGroups: [
      {
        groupId: 'protein',
        name: 'Proteína',
        required: false,
        multiSelect: false,
        options: [
          { optionId: 'chicken', name: 'Pollo a la parrilla', price: 4000 },
          { optionId: 'shrimp', name: 'Camarones', price: 6000 },
          { optionId: 'salmon', name: 'Salmón', price: 7000 }
        ]
      }
    ]
  },
  {
    productId: 'drink-soda',
    name: 'Gaseosa',
    description: 'Gaseosa de 350ml',
    category: 'drinks',
    basePrice: 3500,
    available: true,
    imageUrl: 'https://example.com/drink-soda.jpg',
    modifierGroups: [
      {
        groupId: 'flavor',
        name: 'Sabor',
        required: true,
        multiSelect: false,
        options: [
          { optionId: 'cola', name: 'Cola', price: 0 },
          { optionId: 'lemon', name: 'Limonada', price: 0 },
          { optionId: 'orange', name: 'Naranja', price: 0 }
        ]
      }
    ]
  },
  {
    productId: 'drink-juice',
    name: 'Jugo Natural',
    description: 'Jugo natural de frutas frescas',
    category: 'drinks',
    basePrice: 5000,
    available: true,
    imageUrl: 'https://example.com/drink-juice.jpg',
    modifierGroups: [
      {
        groupId: 'fruit',
        name: 'Fruta',
        required: true,
        multiSelect: false,
        options: [
          { optionId: 'orange', name: 'Naranja', price: 0 },
          { optionId: 'passion-fruit', name: 'Maracuyá', price: 500 },
          { optionId: 'mango', name: 'Mango', price: 500 }
        ]
      }
    ]
  },
  {
    productId: 'dessert-brownie',
    name: 'Brownie con Helado',
    description: 'Brownie de chocolate caliente con helado de vainilla',
    category: 'desserts',
    basePrice: 8000,
    available: true,
    imageUrl: 'https://example.com/dessert-brownie.jpg',
    modifierGroups: []
  },
  {
    productId: 'dessert-cheesecake',
    name: 'Cheesecake',
    description: 'Pastel de queso con base de galleta',
    category: 'desserts',
    basePrice: 9000,
    available: true,
    imageUrl: 'https://example.com/dessert-cheesecake.jpg',
    modifierGroups: [
      {
        groupId: 'topping',
        name: 'Topping',
        required: false,
        multiSelect: false,
        options: [
          { optionId: 'strawberry', name: 'Fresas', price: 1500 },
          { optionId: 'chocolate', name: 'Chocolate', price: 1500 },
          { optionId: 'caramel', name: 'Caramelo', price: 1500 }
        ]
      }
    ]
  }
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

async function seedProducts(): Promise<void> {
  console.log('\nSeeding sample products...');
  
  for (const product of SAMPLE_PRODUCTS) {
    try {
      await dynamoDB.send(
        new PutCommand({
          TableName: 'products',
          Item: {
            ...product,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      );
      console.log(`✓ Added product: ${product.name}`);
    } catch (error) {
      console.error(`✗ Error adding product ${product.name}:`, error);
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
    await createTable(TABLES.products);
    await createTable(TABLES.idempotency);
    
    // Seed data
    await seedProducts();
    
    console.log('\n✅ Database initialization completed successfully!');
    console.log('\nAvailable products by category:');
    console.log('  • Burgers: 2 items');
    console.log('  • Pizzas: 2 items');
    console.log('  • Pastas: 1 item');
    console.log('  • Salads: 1 item');
    console.log('  • Drinks: 2 items');
    console.log('  • Desserts: 2 items');
    console.log('\nTotal: 10 products');
    
  } catch (error) {
    console.error('\n❌ Error initializing database:', error);
    console.error('\nMake sure DynamoDB Local is running:');
    console.error('  docker-compose up -d');
    process.exit(1);
  }
}

main();
