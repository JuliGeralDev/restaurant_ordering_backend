# Restaurant Ordering API

A serverless backend API for restaurant order management built with Clean Architecture principles, featuring event-driven timeline tracking and DynamoDB integration.

## Overview

This project implements a robust ordering system for restaurants using hexagonal architecture (Clean Architecture) with a complete event timeline for order tracking. The system provides RESTful endpoints for order management, pricing calculation, and event auditing.

### Key Features

- **Clean Architecture**: Separation of concerns with well-defined layers (Domain, Application, Infrastructure, Interfaces)
- **Event Sourcing**: Complete timeline tracking for all order events with correlation IDs
- **Type Safety**: Full TypeScript implementation with strict typing
- **Serverless**: Built on AWS Lambda with Serverless Framework for scalable deployment
- **Local Development**: DynamoDB Local support with Docker for offline development
- **Value Objects**: Immutable domain objects (Money) for business logic integrity
- **Repository Pattern**: Abstract data access with multiple implementations (DynamoDB, in-memory)

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)
- [License](#license)

## Prerequisites

Ensure the following tools are installed on your system before proceeding:

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| Node.js | 18.x LTS | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| Docker | Latest | Container runtime for DynamoDB Local | [docker.com](https://www.docker.com/products/docker-desktop) |
| AWS CLI | v2 | DynamoDB table management | [aws.amazon.com/cli](https://aws.amazon.com/cli/) |

### Verification

Verify your installations with the following commands:

```bash
node --version    # Should output v18.x.x
docker --version  # Should output Docker version 20.x or higher
aws --version     # Should output aws-cli/2.x.x
```

## Installation

### Quick Start

For rapid setup, use the automated installation script:

```bash
# Clone the repository
git clone <repository-url>
cd restaurant_ordering_backend

# Install dependencies
npm install

# Initialize database and seed data
npm run setup

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### Manual Installation

If you prefer step-by-step installation:

#### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd restaurant_ordering_backend
npm install
```

#### 2. Configure Database

Start DynamoDB Local using Docker Compose:

```bash
docker-compose up -d
```

Alternatively, use the npm script:

```bash
npm run docker:up
```

#### 3. Initialize Database Schema and Seed Data

```bash
npm run init:db
```

This command will:
- Create the `orders` table for order persistence
- Create the `order_timeline` table for event tracking
- Create the `products` table for menu items
- Insert 10 sample products with configured modifiers

#### 4. Verify Installation

Check that all tables were created successfully:

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1
```

Expected output:
```json
{
    "TableNames": [
        "order_timeline",
        "orders",
        "products"
    ]
}
```

## Configuration

### Environment Variables

The application uses the following default configuration for local development:

- **AWS Region**: `us-east-1`
- **DynamoDB Endpoint**: `http://localhost:8000`
- **API Port**: `3000`

For production deployment, these values should be configured through environment variables or the Serverless Framework configuration.

### DynamoDB Configuration

The DynamoDB client is configured with automatic class instance marshalling in `src/infrastructure/database/dynamo.client.ts`:

```typescript
export const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertClassInstanceToMap: true,
  },
});
```

This configuration enables automatic conversion of domain value objects (such as `Money`) to DynamoDB-compatible formats.

### Database Schema

#### Orders Table

- **Primary Key**: `orderId` (String)
- **Attributes**: `userId`, `status`, `items`, `pricing`, `createdAt`, `updatedAt`

#### Order Timeline Table

- **Partition Key**: `orderId` (String)
- **Sort Key**: `timestamp` (String)
- **Attributes**: `eventId`, `userId`, `type`, `source`, `correlationId`, `payload`

#### Products Table

- **Primary Key**: `productId` (String)
- **Attributes**: `name`, `description`, `category`, `basePrice`, `available`, `modifierGroups`

## Usage

### Starting the Development Server

```bash
npm run dev
```

The server runs with hot reload enabled via Serverless Offline. The `--noPrependStageInUrl` flag removes the `/dev` prefix from endpoints.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run setup` | Complete setup (Docker + DB + seed data) |
| `npm run init:db` | Initialize database schema and seed data |
| `npm run docker:up` | Start DynamoDB Local container |
| `npm run docker:down` | Stop DynamoDB Local container |
| `npm run docker:logs` | View DynamoDB container logs |

### Sample Data

The initialization script seeds the database with 10 products across 6 categories:

- **Burgers** (2): Classic Burger ($120), BBQ Burger ($140)
- **Pizzas** (2): Margherita ($180), Pepperoni ($200)
- **Pastas** (1): Carbonara ($160)
- **Salads** (1): Caesar Salad ($110)
- **Drinks** (2): Soda ($35), Natural Juice ($50)
- **Desserts** (2): Brownie with Ice Cream ($80), Cheesecake ($90)

Each product includes configurable modifier groups (sizes, extras, cooking points, etc.).

## API Documentation

### Endpoints

#### 1. Hello (Test Endpoint)

Adds an item to the cart and returns the complete order timeline.

```
GET /hello
```

**Response Example:**
```json
{
  "order": {
    "orderId": "order-1",
    "userId": "user-1",
    "status": "CREATED",
    "items": [
      {
        "productId": "product-1",
        "name": "Burger",
        "basePrice": { "amount": 10000 },
        "quantity": 2,
        "modifiers": []
      }
    ],
    "pricing": {
      "subtotal": { "amount": 20000 },
      "tax": { "amount": 0 },
      "serviceFee": { "amount": 0 },
      "total": { "amount": 20000 }
    },
    "createdAt": "2026-03-20T22:00:00.000Z",
    "updatedAt": "2026-03-20T22:00:00.000Z"
  },
  "lastEvent": { /* ... */ },
  "timeline": [ /* ... */ ]
}
```

#### 2. Get Order Timeline

Retrieves the event timeline for a specific order.

```
GET /orders/{orderId}/timeline
```

**Query Parameters:**
- `page` (optional, default: 1): Page number for pagination
- `pageSize` (optional, default: 10): Number of events per page

**Response Example:**
```json
{
  "orderId": "order-1",
  "timeline": [
    {
      "eventId": "uuid-v4",
      "timestamp": "2026-03-20T22:06:17.337Z",
      "orderId": "order-1",
      "userId": "user-1",
      "type": "ORDER_STATUS_CHANGED",
      "source": "api",
      "correlationId": "uuid-v4",
      "payload": {
        "status": "CREATED",
        "previousStatus": null
      }
    },
    {
      "eventId": "uuid-v4",
      "timestamp": "2026-03-20T22:06:17.338Z",
      "orderId": "order-1",
      "userId": "user-1",
      "type": "CART_ITEM_ADDED",
      "source": "api",
      "correlationId": "uuid-v4",
      "payload": {
        "productId": "product-1",
        "name": "Burger",
        "quantity": 2,
        "basePrice": 10000
      }
    },
    {
      "eventId": "uuid-v4",
      "timestamp": "2026-03-20T22:06:17.339Z",
      "orderId": "order-1",
      "userId": "user-1",
      "type": "PRICING_CALCULATED",
      "source": "api",
      "correlationId": "uuid-v4",
      "payload": {
        "subtotal": 20000,
        "tax": 0,
        "serviceFee": 0,
        "total": 20000
      }
    }
  ]
}
```

#### 3. Get Order

Retrieves the current state of an order.

```
GET /orders/{orderId}
```

**Response Example:**
```json
{
  "orderId": "order-1",
  "userId": "user-1",
  "status": "CREATED",
  "items": [ /* ... */ ],
  "pricing": { /* ... */ },
  "createdAt": "2026-03-20T22:00:00.000Z",
  "updatedAt": "2026-03-20T22:06:17.339Z"
}
```

### Event Types

The system emits the following event types:

- `ORDER_STATUS_CHANGED`: Order status transition
- `CART_ITEM_ADDED`: New item added to cart
- `CART_ITEM_UPDATED`: Item quantity or modifiers updated
- `CART_ITEM_REMOVED`: Item removed from cart
- `PRICING_CALCULATED`: Order pricing recalculated
- `ORDER_PLACED`: Order submitted
- `VALIDATION_FAILED`: Validation error occurred

## Architecture

This project follows Clean Architecture (Hexagonal Architecture) principles with clear separation of concerns:

### Project Structure

```
restaurant_ordering_backend/
├── scripts/
│   ├── init-db.ts              # Database initialization and seeding
│   ├── setup.ps1               # Windows setup script
│   └── setup.sh                # Unix setup script
├── src/
│   ├── application/            # Application layer (use cases)
│   │   └── use-cases/
│   │       └── add-item-to-cart.use-case.ts
│   ├── domain/                 # Domain layer (business logic)
│   │   ├── entities/
│   │   │   ├── order.entity.ts
│   │   │   └── timeline-event.entity.ts
│   │   ├── repositories/       # Repository interfaces
│   │   │   ├── order.repository.ts
│   │   │   └── timeline.repository.ts
│   │   ├── services/
│   │   │   └── pricing.service.ts
│   │   └── value-objects/
│   │       └── money.vo.ts
│   ├── infrastructure/         # Infrastructure layer (external dependencies)
│   │   ├── container.ts
│   │   ├── database/
│   │   │   └── dynamo.client.ts
│   │   └── repositories/       # Repository implementations
│   │       ├── dynamo-order.repository.ts
│   │       ├── dynamo-timeline.repository.ts
│   │       ├── in-memory-order.repository.ts
│   │       └── in-memory-timeline.repository.ts
│   └── interfaces/             # Interface layer (API handlers)
│       ├── get-order-timeline.ts
│       ├── get-order.ts
│       ├── hello.ts
│       └── index.ts
├── docker-compose.yml
├── package.json
├── serverless.yml
└── tsconfig.json
```

### Layer Responsibilities

#### Domain Layer
- Contains core business entities and value objects
- Defines repository interfaces (ports)
- Implements business rules and domain services
- No external dependencies

#### Application Layer
- Orchestrates use cases and workflows
- Coordinates between domain services and repositories
- Handles application-specific business logic

#### Infrastructure Layer
- Implements repository interfaces (adapters)
- Manages external dependencies (DynamoDB, etc.)
- Handles data persistence and retrieval
- Contains dependency injection container

#### Interface Layer
- HTTP request/response handling
- Input validation and transformation
- Delegates to application use cases

### Technology Stack

#### Core Framework
- **Serverless Framework** v3.40.0: Infrastructure as code and deployment
- **Serverless Offline** v12.0.4: Local development emulator
- **TypeScript** v5.9.3: Static typing and enhanced developer experience

#### Database
- **AWS DynamoDB**: NoSQL database for production
- **DynamoDB Local**: Local development database (Docker)
- **@aws-sdk/client-dynamodb** v3.967.0: AWS SDK for DynamoDB operations
- **@aws-sdk/lib-dynamodb** v3.967.0: Document client with automatic marshalling

#### Build Tools
- **esbuild** v0.27.4: Fast JavaScript bundler
- **serverless-esbuild** v1.57.0: Serverless Framework integration for esbuild
- **ts-node** v10.9.2: TypeScript execution for scripts

#### Validation
- **Zod** v4.3.6: Schema validation library (TypeScript-first)

## Development

### Local Development Workflow

1. Ensure DynamoDB Local is running:
   ```bash
   npm run docker:up
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Make changes to the code (hot reload is enabled)

4. Test endpoints using curl or Postman

### Docker Commands

```bash
# Start DynamoDB Local
docker-compose up -d

# Stop DynamoDB Local
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Check service status
docker-compose ps
```

### Database Management

#### List all tables
```bash
aws dynamodb list-tables \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

#### Scan table contents
```bash
aws dynamodb scan \
  --table-name orders \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

#### Delete specific item
```bash
aws dynamodb delete-item \
  --table-name orders \
  --key '{"orderId":{"S":"order-1"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

#### Reset database
```bash
# Stop containers and remove volumes
npm run docker:down
docker volume rm dynamodb_data

# Reinitialize
npm run setup
```

### Automated Setup Scripts

Platform-specific scripts are provided for automated environment setup:

**Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

These scripts perform the following operations:
1. Verify required tools are installed (Node.js, Docker, AWS CLI)
2. Install npm dependencies
3. Start DynamoDB Local
4. Initialize database schema
5. Seed sample data
6. Display usage instructions

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot do operations on a non-existent table"

**Cause:** Database tables have not been created.

**Solution:**
```bash
npm run init:db
```

#### Issue: "Cannot connect to DynamoDB"

**Cause:** DynamoDB Local is not running.

**Solution:**
```bash
npm run docker:up
```

#### Issue: "Port 8000 is already in use"

**Cause:** Another process is using port 8000.

**Solution:**
```bash
# Stop existing container
npm run docker:down

# Or force remove
docker rm -f dynamodb
```

#### Issue: "Container name '/dynamodb' already in use"

**Cause:** A stopped container with the same name exists.

**Solution:**
```bash
docker rm -f dynamodb
npm run docker:up
```

#### Issue: "Unsupported type passed: [object Object]"

**Cause:** DynamoDB marshalling configuration issue.

**Solution:** This has been resolved in `src/infrastructure/database/dynamo.client.ts` with the `convertClassInstanceToMap: true` option.

### Reset Database Completely

To start with a clean database:

```bash
# Stop and remove containers
npm run docker:down

# Remove persistent volume (deletes all data)
docker volume rm dynamodb_data

# Reinitialize everything
npm run setup
```

### Debugging

Enable detailed logging:

```bash
# View DynamoDB Local logs
npm run docker:logs

# View Serverless Offline logs
npm run dev
```

## Additional Resources

- **[SEED_DATA.md](docs/SEED_DATA.md)**: Comprehensive guide for customizing sample products and menu data
- **[COMMANDS.md](docs/COMMANDS.md)**: Quick reference cheat sheet for common commands

## License

This project is licensed under the ISC License.

## Author

**Juliana García Corredor**  
GitHub: [@JuliGeralDev](https://github.com/JuliGeralDev)  
Email: juliana.c@gmail.com

---

*Built with Clean Architecture principles for maintainability, testability, and scalability.*
