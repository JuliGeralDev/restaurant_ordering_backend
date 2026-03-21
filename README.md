# Restaurant Ordering API

Backend API for restaurant order management built with Clean Architecture, featuring event-driven timeline tracking and DynamoDB.

## Overview

Serverless REST API for restaurant ordering with:
- **Clean Architecture**: Domain, Application, Infrastructure, Interfaces layers
- **Event Timeline**: Complete audit trail for all order events
- **TypeScript**: Full type safety
- **DynamoDB Local**: Local development with Docker

## Prerequisites

| Tool | Required Version | Check |
|------|-----------------|-------|
| Node.js | 18.x LTS | `node --version` |
| Docker Desktop | Latest | `docker --version` |
| AWS CLI | v2.x | `aws --version` |

**Install:**
- Node.js: https://nodejs.org
- Docker: https://www.docker.com/products/docker-desktop
- AWS CLI: https://aws.amazon.com/cli/

## Getting Started

### Quick Setup (Recommended)

```bash
# 1. Clone and install
git clone <repository-url>
cd restaurant_ordering_backend
npm install

# 2. Setup database (this takes ~15 seconds)
#    - Starts Docker container
#    - Waits for DynamoDB to be ready
#    - Creates tables
#    - Seeds sample data
npm run setup

# 3. Start the API
npm run dev

# 4. Test it
curl http://localhost:3000/hello
```

**Done!** If you see JSON with order data, everything works.

**Note:** The `npm run setup` command includes a 10-second wait to ensure DynamoDB is fully ready before creating tables.

---

### Manual Setup (Step by Step)

If you want to understand each step:

#### Step 1: Install Dependencies

```bash
git clone <repository-url>
cd restaurant_ordering_backend
npm install
```

#### Step 2: Start DynamoDB

```bash
docker-compose up -d
```

Wait 5 seconds, then verify:

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1
```

Should return empty list: `{ "TableNames": [] }`

**⚠️ Important:** DynamoDB runs in-memory mode. All data is lost when you stop the container. Run `npm run init:db` again after restarting.

#### Step 3: Create Tables and Seed Data

```bash
npm run init:db
```

You should see:
```
✓ Connected to DynamoDB Local
✓ Table orders created successfully
✓ Table order_timeline created successfully
✓ Table menu created successfully
✓ Table idempotency created successfully
✓ Added menu item: Classic Burger
...
✅ Database initialization completed successfully!
```

#### Step 4: Start the API

```bash
npm run dev
```

#### Step 5: Test

```bash
curl http://localhost:3000/hello
```

If you see JSON with order data, **you're done!**

## Quick Reference

### Daily Commands

```bash
# Start API
npm run dev

# Stop DynamoDB
docker-compose down

# Start DynamoDB (if stopped)
docker-compose up -d

# View logs
docker-compose logs -f
```

### Reset Database

```bash
docker-compose down
docker volume rm dynamodb_data
docker-compose up -d
npm run init:db
```

## API Endpoints

### GET /hello
Test endpoint - creates sample order

```bash
curl http://localhost:3000/hello
```

### GET /orders/{orderId}
Get order details

```bash
curl http://localhost:3000/orders/order-1
```

### GET /orders/{orderId}/timeline
Get order event timeline

```bash
curl http://localhost:3000/orders/order-1/timeline
curl "http://localhost:3000/orders/order-1/timeline?page=1&pageSize=10"
```

## Sample Data

After `npm run init:db`, you get 11 menu items:

- **ID 1**: Classic Burger ($15,000)
- **ID 2**: Cheese Burger ($17,000)
- **ID 3**: Chicken Burger ($16,000)
- **ID 4**: Veggie Burger ($14,000)
- **ID 5**: Double Burger ($20,000)
- **ID 6**: Hot Dog ($12,000)
- **ID 7**: Fries ($8,000)
- **ID 8**: Onion Rings ($9,000)
- **ID 9**: Soda ($5,000)
- **ID 10**: Custom Burger ($18,000) - **with modifiers** (protein, toppings, sauces)
- **ID 11**: Custom Pizza ($22,000) - **with modifiers** (protein, toppings, sauces)

## Architecture

```
src/
├── domain/          # Entities, value objects, repository interfaces
├── application/     # Use cases (business logic orchestration)
├── infrastructure/  # DynamoDB, repository implementations
└── interfaces/      # HTTP handlers
```

**Tech Stack:**
- Serverless Framework 3.40.0
- TypeScript 5.9.3
- DynamoDB (AWS SDK v3.967.0)
- esbuild 0.27.4

## Troubleshooting

### "Cannot connect to DynamoDB"

Start DynamoDB:
```bash
docker-compose up -d
```

### "Table does not exist"

Create tables:
```bash
npm run init:db
```

### "Port 8000 already in use"

Remove old container:
```bash
docker rm -f dynamodb
docker-compose up -d
```

### "npm run dev failed"

Check if there are TypeScript errors:
```bash
npm install
```

### Complete Reset

```bash
docker-compose down
docker volume rm dynamodb_data
rm -rf node_modules package-lock.json
npm install
docker-compose up -d
npm run init:db
npm run dev
```

## Database Tables

- **orders**: Order data (PK: `orderId`)
- **order_timeline**: Events (PK: `orderId`, SK: `timestamp`)
- **menu**: Menu items (PK: `productId`)
- **idempotency**: Idempotency keys (PK: `key`)

## Event Types

- `ORDER_STATUS_CHANGED`: Status transition
- `CART_ITEM_ADDED`: New item
- `CART_ITEM_UPDATED`: Item modified
- `PRICING_CALCULATED`: Price recalculated

## License

ISC

## Author

**Juliana García Corredor**  
GitHub: [@JuliGeralDev](https://github.com/JuliGeralDev)  
Email: juliana.c@gmail.com
