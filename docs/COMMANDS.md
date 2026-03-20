# Comandos Rápidos - Cheat Sheet

Referencia rápida de comandos más usados en el proyecto.

## Instalación Inicial

```bash
npm install                 # Instalar dependencias
npm run setup               # Configurar todo (Docker + DB + Datos)
npm run dev                 # Iniciar servidor de desarrollo
```

## Desarrollo Diario

```bash
npm run dev                 # Iniciar servidor (http://localhost:3000)
npm run docker:up           # Iniciar DynamoDB
npm run docker:down         # Detener DynamoDB
npm run docker:logs         # Ver logs de DynamoDB
```

## Base de Datos

```bash
npm run init:db             # Crear tablas y datos de muestra

# Ver tablas
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1

# Ver productos
aws dynamodb scan --table-name products --endpoint-url http://localhost:8000 --region us-east-1

# Ver órdenes
aws dynamodb scan --table-name orders --endpoint-url http://localhost:8000 --region us-east-1

# Ver timeline
aws dynamodb scan --table-name order_timeline --endpoint-url http://localhost:8000 --region us-east-1
```

## Docker

```bash
docker-compose up -d        # Iniciar servicios
docker-compose down         # Detener servicios
docker-compose logs -f      # Ver logs en tiempo real
docker-compose ps           # Ver estado de servicios
docker ps                   # Ver contenedores activos
docker logs dynamodb -f     # Ver logs de DynamoDB
docker rm -f dynamodb       # Forzar eliminación del contenedor
docker volume rm dynamodb_data  # Eliminar volumen (borra datos)
```

## Resetear Todo

```bash
# Opción 1: Mantener código, limpiar DB
npm run docker:down
docker volume rm dynamodb_data
npm run setup

# Opción 2: Reinstalación completa
rm -rf node_modules
npm install
npm run setup
```

## Testing Endpoints

```bash
# Hello (test completo)
curl http://localhost:3000/hello

# Get Order
curl http://localhost:3000/orders/order-1

# Get Timeline
curl http://localhost:3000/orders/order-1/timeline

# Con query params
curl "http://localhost:3000/orders/order-1/timeline?page=1&pageSize=10"
```

## PowerShell (Windows)

```powershell
# Testing endpoints con PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/hello" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/orders/order-1" -Method GET

# Ver procesos en puerto 8000
Get-NetTCPConnection -LocalPort 8000

# Matar proceso en puerto 8000
Get-NetTCPConnection -LocalPort 8000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

## DynamoDB - Operaciones Comunes

```bash
# Eliminar un item específico
aws dynamodb delete-item \
  --table-name orders \
  --key '{"orderId":{"S":"order-1"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Obtener un item específico
aws dynamodb get-item \
  --table-name products \
  --key '{"productId":{"S":"burger-classic"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Contar items en una tabla
aws dynamodb scan \
  --table-name products \
  --select COUNT \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Eliminar tabla
aws dynamodb delete-table \
  --table-name products \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

## Git (Recomendaciones)

```bash
# Primer commit
git init
git add .
git commit -m "Initial commit: Restaurant Ordering API"

# Ignorar archivos innecesarios (ya configurado en .gitignore)
# - node_modules
# - .esbuild
# - .env
# - dist
```

## Troubleshooting Rápido

```bash
# Puerto 8000 ocupado
docker rm -f dynamodb
npm run docker:up

# Tablas no existen
npm run init:db

# Datos corruptos
npm run docker:down
docker volume rm dynamodb_data
npm run setup

# Dependencias desactualizadas
rm -rf node_modules package-lock.json
npm install

# Ver si DynamoDB está corriendo
docker ps | grep dynamodb
curl http://localhost:8000
```

## Verificación de Salud del Sistema

```bash
# Verificar versiones
node --version              # Debe ser v18.x
npm --version
docker --version
aws --version

# Verificar servicios
docker ps                   # DynamoDB debe estar corriendo
curl http://localhost:3000/hello  # API debe responder

# Verificar tablas
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1
# Debe mostrar: orders, order_timeline, products
```

## Variables de Entorno (Futuro)

Cuando agregues `.env`:

```bash
# Ejemplo de .env
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000
NODE_ENV=development
PORT=3000
```

## Logs y Debug

```bash
# Ver logs de serverless offline
npm run dev

# Ver logs de DynamoDB
docker logs dynamodb -f

# Ver logs detallados de esbuild
# Revisar output en terminal durante npm run dev
```

## Productividad

```bash
# Alias útiles (agregar a .bashrc o .zshrc)
alias dev='npm run dev'
alias dstart='npm run docker:up'
alias dstop='npm run docker:down'
alias dlogs='docker logs dynamodb -f'
alias initdb='npm run init:db'
alias setup='npm run setup'
```

## Scripts Personalizados

Los siguientes scripts están disponibles en `package.json`:

- `npm run dev` - Desarrollo
- `npm run init:db` - Inicializar DB
- `npm run docker:up` - Docker up
- `npm run docker:down` - Docker down
- `npm run docker:logs` - Ver logs
- `npm run setup` - Setup completo
